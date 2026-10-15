using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class NotaServicoRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        private const string SelectBase = @"
            SELECT n.*,
                   c.Cliente, c.Ativo AS ClienteAtivo,
                   cp.CondicaoPagamento AS CondicaoDescricao
            FROM notasServico n
            LEFT JOIN clientes c ON c.CodCliente = n.codCliente
            LEFT JOIN condicaopagamentos cp ON cp.CodCondicao = n.codCondicao";

        private const string SelectItens = @"
            SELECT i.*,
                   s.Servico, s.Ativo AS ServicoAtivo
            FROM servicosNotaServico i
            LEFT JOIN servicos s ON s.CodServico = i.codServico
            WHERE i.numero = @numero AND i.modelo = @modelo
              AND i.serie = @serie AND i.codCliente = @codCliente";

        public async Task<IEnumerable<NotasServicos>> GetAllAsync()
        {
            var list = new List<NotasServicos>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(
                $"{SelectBase} ORDER BY n.numero, n.modelo, n.serie, n.codCliente", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<IEnumerable<NotasServicos>> GetByClienteAsync(int codCliente)
        {
            var list = new List<NotasServicos>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(
                $"{SelectBase} WHERE n.codCliente = @codCliente ORDER BY n.numero, n.modelo, n.serie", con);
            cmd.Parameters.AddWithValue("@codCliente", codCliente);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<NotasServicos?> GetByIdAsync(string numero, string modelo, string serie, int codCliente)
        {
            await using var con = Conn();
            await con.OpenAsync();

            NotasServicos? nota;
            await using (var cmd = new MySqlCommand($@"{SelectBase}
                WHERE n.numero = @numero AND n.modelo = @modelo
                  AND n.serie = @serie AND n.codCliente = @codCliente", con))
            {
                AddChave(cmd, numero, modelo, serie, codCliente);
                await using var rd = await cmd.ExecuteReaderAsync();
                nota = await rd.ReadAsync() ? Map(rd) : null;
            }

            if (nota is null)
                return null;

            nota.Servicos = (await GetItensAsync(con, numero, modelo, serie, codCliente)).ToList();
            return nota;
        }

        private static async Task<IEnumerable<ServicosNotaServico>> GetItensAsync(
            MySqlConnection con, string numero, string modelo, string serie, int codCliente)
        {
            var list = new List<ServicosNotaServico>();
            await using var cmd = new MySqlCommand(SelectItens, con);
            AddChave(cmd, numero, modelo, serie, codCliente);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(MapItem(rd));
            return list;
        }

        public async Task<NotasServicos> CreateAsync(NotasServicos body)
        {
            body.Situacao = "PENDENTE";

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                await using (var cmd = new MySqlCommand(@"
                    INSERT INTO notasServico
                        (numero, serie, modelo, codCliente, dataEmissao, valorServicos, valorDesconto,
                         valorTotal, codCondicao, observacoes, situacao)
                    VALUES
                        (@numero, @serie, @modelo, @codCliente, @dataEmissao, @valorServicos, @valorDesconto,
                         @valorTotal, @codCondicao, @observacoes, @situacao)",
                    con, tx))
                {
                    AddParams(cmd, body);
                    await cmd.ExecuteNonQueryAsync();
                }

                foreach (var item in body.Servicos)
                    await InserirItemAsync(con, tx, body.Numero, body.Modelo, body.Serie, body.CodCliente, item);

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync("NotasServico", "CRIOU",
                $"Criou Nota de Serviço: Nº {body.Numero}/{body.Serie} (Modelo {body.Modelo}) - " +
                $"Cliente {body.CodCliente} com {body.Servicos.Count} item(ns)");

            return body;
        }

        public async Task UpdateAsync(NotasServicos body)
        {
            var antes = await GetByIdAsync(body.Numero, body.Modelo, body.Serie, body.CodCliente);

            if (antes is null)
                throw new InvalidOperationException("Nota de serviço não encontrada.");

            if (!string.Equals(antes.Situacao, "PENDENTE", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    $"A nota está com situação {antes.Situacao} e não pode mais ser editada.");

            body.Situacao = "PENDENTE";

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                await using (var cmd = new MySqlCommand(@"
                    UPDATE notasServico SET
                        dataEmissao = @dataEmissao,
                        valorServicos = @valorServicos,
                        valorDesconto = @valorDesconto,
                        valorTotal = @valorTotal,
                        codCondicao = @codCondicao,
                        observacoes = @observacoes,
                        situacao = @situacao
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codCliente = @codCliente",
                    con, tx))
                {
                    AddParams(cmd, body);
                    await cmd.ExecuteNonQueryAsync();
                }

                await using (var delCmd = new MySqlCommand(@"
                    DELETE FROM servicosNotaServico
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codCliente = @codCliente", con, tx))
                {
                    AddChave(delCmd, body.Numero, body.Modelo, body.Serie, body.CodCliente);
                    await delCmd.ExecuteNonQueryAsync();
                }

                foreach (var item in body.Servicos)
                    await InserirItemAsync(con, tx, body.Numero, body.Modelo, body.Serie, body.CodCliente, item);

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            var mudancas = new List<string>();

            if (antes.ValorTotal != body.ValorTotal)
                mudancas.Add($"Valor Total: {body.ValorTotal:C} (Era {antes.ValorTotal:C})");

            if (antes.ValorDesconto != body.ValorDesconto)
                mudancas.Add($"Desconto: {body.ValorDesconto:C} (Era {antes.ValorDesconto:C})");

            if (antes.CodCondicao != body.CodCondicao)
                mudancas.Add($"Condição Pagamento: {body.CodCondicao} (Era {antes.CodCondicao})");

            if (antes.Servicos.Count != body.Servicos.Count)
                mudancas.Add($"Itens: {body.Servicos.Count} (Era {antes.Servicos.Count})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";

            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Nota de Serviço: Nº {body.Numero}/{body.Serie}"
                : $"Editou Nota de Serviço: Nº {body.Numero}/{body.Serie}. {diff}";

            await log.AddAsync("NotasServico", "EDITOU", desc);
        }

        public async Task ConfirmarAsync(string numero, string modelo, string serie, int codCliente)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                string situacao;
                int? codCondicao;
                decimal valorTotal;
                DateTime dataEmissao;

                // Trava a nota e lê tudo que precisa numa consulta só
                await using (var cmd = new MySqlCommand(@"
                    SELECT situacao, codCondicao, valorTotal, dataEmissao
                    FROM notasServico
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codCliente = @codCliente
                    FOR UPDATE", con, tx))
                {
                    AddChave(cmd, numero, modelo, serie, codCliente);
                    await using var rd = await cmd.ExecuteReaderAsync();

                    if (!await rd.ReadAsync())
                        throw new InvalidOperationException("Nota de serviço não encontrada.");

                    situacao = rd.GetString("situacao");
                    codCondicao = rd.IsDBNull(rd.GetOrdinal("codCondicao")) ? null : rd.GetInt32("codCondicao");
                    valorTotal = rd.GetDecimal("valorTotal");
                    dataEmissao = rd.GetDateTime("dataEmissao");
                }

                if (!string.Equals(situacao, "PENDENTE", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException(
                        $"A nota não pode ser confirmada porque está com situação {situacao}.");

                int qtdItens;
                await using (var cmd = new MySqlCommand(@"
                    SELECT COUNT(*) FROM servicosNotaServico
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codCliente = @codCliente", con, tx))
                {
                    AddChave(cmd, numero, modelo, serie, codCliente);
                    qtdItens = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                }

                if (qtdItens == 0)
                    throw new InvalidOperationException(
                        "A nota não pode ser confirmada porque não possui serviços.");

                // Gera as parcelas em contasReceberServico
                await ContaReceberServicoRepository.GerarContasDaNotaAsync(
                    con, tx, numero, modelo, serie, codCliente,
                    codCondicao, valorTotal, dataEmissao);

                await using (var cmd = new MySqlCommand(@"
                    UPDATE notasServico
                    SET situacao = 'CONFERIDA'
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codCliente = @codCliente
                      AND situacao = 'PENDENTE'", con, tx))
                {
                    AddChave(cmd, numero, modelo, serie, codCliente);

                    if (await cmd.ExecuteNonQueryAsync() != 1)
                        throw new InvalidOperationException(
                            "Não foi possível confirmar a nota de serviço.");
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync("NotasServico", "CONFIRMOU",
                $"Conferiu Nota de Serviço: Nº {numero}/{serie} (Modelo {modelo}) - Cliente {codCliente}");
        }

        public async Task DeleteAsync(string numero, string modelo, string serie, int codCliente)
        {
            var nota = await GetByIdAsync(numero, modelo, serie, codCliente);

            if (nota is null)
                throw new InvalidOperationException("Nota de serviço não encontrada.");

            if (!string.Equals(nota.Situacao, "PENDENTE", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    $"A nota está com situação {nota.Situacao} e não pode ser excluída.");

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                // Os itens saem junto (ON DELETE CASCADE)
                await using (var cmd = new MySqlCommand(@"
                    DELETE FROM notasServico
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codCliente = @codCliente
                      AND situacao = 'PENDENTE'", con, tx))
                {
                    AddChave(cmd, numero, modelo, serie, codCliente);
                    await cmd.ExecuteNonQueryAsync();
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync("NotasServico", "EXCLUIU",
                $"Excluiu Nota de Serviço: Nº {numero}/{serie} (Modelo {modelo}) - Cliente {codCliente}");
        }

        // Cancela a nota desfazendo seus efeitos, tudo na mesma transação:
        //  - CONFERIDA: cancela as contas a receber (bloqueia se houver parcela recebida)
        //  - Serviço não movimenta estoque, então não há nada a restaurar
        public async Task CancelarAsync(string numero, string modelo, string serie, int codCliente, string motivo)
        {
            if (string.IsNullOrWhiteSpace(motivo))
                throw new InvalidOperationException("O motivo do cancelamento é obrigatório.");

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                string situacao;
                await using (var cmd = new MySqlCommand(@"
                    SELECT situacao FROM notasServico
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codCliente = @codCliente
                    FOR UPDATE", con, tx))
                {
                    AddChave(cmd, numero, modelo, serie, codCliente);
                    situacao = (await cmd.ExecuteScalarAsync())?.ToString()
                        ?? throw new InvalidOperationException("Nota de serviço não encontrada.");
                }

                if (situacao.Equals("CANCELADA", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("A nota de serviço já está cancelada.");

                if (situacao.Equals("CONFERIDA", StringComparison.OrdinalIgnoreCase))
                {
                    // Contas a receber: bloqueia se alguma já foi recebida, senão cancela
                    await ContaReceberServicoRepository.CancelarContasDaNotaAsync(
                        con, tx, numero, modelo, serie, codCliente);
                }

                await using (var cmd = new MySqlCommand(@"
                    UPDATE notasServico
                    SET situacao = 'CANCELADA',
                        motivoCancelamento = @motivo
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codCliente = @codCliente
                      AND situacao = @situacaoAtual", con, tx))
                {
                    AddChave(cmd, numero, modelo, serie, codCliente);
                    cmd.Parameters.AddWithValue("@motivo", motivo.Trim());
                    cmd.Parameters.AddWithValue("@situacaoAtual", situacao);

                    if (await cmd.ExecuteNonQueryAsync() != 1)
                        throw new InvalidOperationException(
                            $"Não foi possível cancelar a nota de serviço. Situação atual: {situacao}.");
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync("NotasServico", "CANCELOU",
                $"Cancelou Nota de Serviço: Nº {numero}/{serie} (Modelo {modelo}) - " +
                $"Cliente {codCliente}. Motivo: {motivo.Trim()}");
        }

        private static async Task InserirItemAsync(
            MySqlConnection con, MySqlTransaction tx,
            string numero, string modelo, string serie, int codCliente, ServicosNotaServico item)
        {
            await using var cmd = new MySqlCommand(@"
                INSERT INTO servicosNotaServico
                    (numero, modelo, serie, codCliente, codServico,
                     quantidade, valorUnitario, valorTotal, descontoPercentual, descontoValor)
                VALUES
                    (@numero, @modelo, @serie, @codCliente, @codServico,
                     @quantidade, @valorUnitario, @valorTotal, @descontoPercentual, @descontoValor)",
                con, tx);

            AddChave(cmd, numero, modelo, serie, codCliente);
            cmd.Parameters.AddWithValue("@codServico", item.CodServico);
            cmd.Parameters.AddWithValue("@quantidade", item.Quantidade);
            cmd.Parameters.AddWithValue("@valorUnitario", item.ValorUnitario);
            cmd.Parameters.AddWithValue("@valorTotal", item.ValorTotal);
            cmd.Parameters.AddWithValue("@descontoPercentual", item.DescontoPercentual);
            cmd.Parameters.AddWithValue("@descontoValor", item.DescontoValor);

            await cmd.ExecuteNonQueryAsync();
        }

        private static void AddChave(MySqlCommand cmd, string numero, string modelo, string serie, int codCliente)
        {
            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@codCliente", codCliente);
        }

        private static void AddParams(MySqlCommand cmd, NotasServicos n)
        {
            AddChave(cmd, n.Numero, n.Modelo, n.Serie, n.CodCliente);
            cmd.Parameters.AddWithValue("@dataEmissao", n.DataEmissao);
            cmd.Parameters.AddWithValue("@valorServicos", n.ValorServicos);
            cmd.Parameters.AddWithValue("@valorDesconto", n.ValorDesconto);
            cmd.Parameters.AddWithValue("@valorTotal", n.ValorTotal);
            cmd.Parameters.AddWithValue("@codCondicao", (object?)n.CodCondicao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@observacoes", (object?)n.Observacoes ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@situacao", n.Situacao);
        }

        static NotasServicos Map(MySqlDataReader rd) => new()
        {
            Numero = rd.GetString("numero"),
            Serie = rd.GetString("serie"),
            Modelo = rd.GetString("modelo"),
            CodCliente = rd.GetInt32("codCliente"),
            DataEmissao = rd.GetDateTime("dataEmissao"),
            ValorServicos = rd.GetDecimal("valorServicos"),
            ValorDesconto = rd.GetDecimal("valorDesconto"),
            ValorTotal = rd.GetDecimal("valorTotal"),
            CodCondicao = rd.IsDBNull(rd.GetOrdinal("codCondicao")) ? null : rd.GetInt32("codCondicao"),
            Observacoes = rd.IsDBNull(rd.GetOrdinal("observacoes")) ? null : rd.GetString("observacoes"),
            Situacao = rd.GetString("situacao"),

            Cliente = rd.IsDBNull(rd.GetOrdinal("Cliente")) ? null : new Clientes
            {
                CodCliente = rd.GetInt32("codCliente"),
                Cliente = rd.GetString("Cliente"),
                Ativo = !rd.IsDBNull(rd.GetOrdinal("ClienteAtivo")) && rd.GetBoolean("ClienteAtivo"),
            },

            CondicaoPagamento = rd.IsDBNull(rd.GetOrdinal("CondicaoDescricao")) ? null : new CondicaoPagamentos
            {
                CodCondicao = rd.GetInt32("codCondicao"),
                CondicaoPagamento = rd.GetString("CondicaoDescricao"),
            },
        };

        static ServicosNotaServico MapItem(MySqlDataReader rd) => new()
        {
            Numero = rd.GetString("numero"),
            Modelo = rd.GetString("modelo"),
            Serie = rd.GetString("serie"),
            CodCliente = rd.GetInt32("codCliente"),
            CodServico = rd.GetInt32("codServico"),
            Quantidade = rd.GetInt32("quantidade"),
            ValorUnitario = rd.GetDecimal("valorUnitario"),
            ValorTotal = rd.GetDecimal("valorTotal"),
            DescontoPercentual = rd.GetDecimal("descontoPercentual"),
            DescontoValor = rd.GetDecimal("descontoValor"),

            Servico = rd.IsDBNull(rd.GetOrdinal("Servico")) ? null : new Servicos
            {
                CodServico = rd.GetInt32("codServico"),
                Servico = rd.GetString("Servico"),
                Ativo = !rd.IsDBNull(rd.GetOrdinal("ServicoAtivo")) && rd.GetBoolean("ServicoAtivo"),
            }
        };
    }
}