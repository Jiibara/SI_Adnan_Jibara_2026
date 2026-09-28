using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class NotaSaidaRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));


        private const string SelectBase = @"
            SELECT n.*,
                   c.CodCliente, c.Cliente, c.Ativo AS ClienteAtivo,
                   cp.CodCondicao, cp.CondicaoPagamento AS CondicaoDescricao,
                   t.CodTransp, t.Transportador, t.Ativo AS TransportadorAtivo
            FROM notasSaida n
            LEFT JOIN clientes c ON c.CodCliente = n.codCliente
            LEFT JOIN condicaopagamentos cp ON cp.CodCondicao = n.codCondicao
            LEFT JOIN transportadores t ON t.CodTransp = n.codTransp";

        private const string SelectItens = @"
            SELECT pi.*,
                   p.CodProd, p.Produto, p.unidade AS ProdutoUnidade, p.Ativo AS ProdutoAtivo
            FROM produtosNotaSaida pi
            LEFT JOIN produtos p ON p.CodProd = pi.codProd
            WHERE pi.numero = @numero AND pi.modelo = @modelo
              AND pi.serie = @serie AND pi.codCliente = @codCliente";

        public async Task<IEnumerable<NotasSaidas>> GetAllAsync()
        {
            var list = new List<NotasSaidas>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(
                $"{SelectBase} ORDER BY n.numero, n.modelo, n.serie, n.codCliente", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<IEnumerable<NotasSaidas>> GetByClienteAsync(int codCliente)
        {
            var list = new List<NotasSaidas>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand($"{SelectBase} WHERE n.codCliente = @codCliente", con);
            cmd.Parameters.AddWithValue("@codCliente", codCliente);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<NotasSaidas?> GetByIdAsync(int numero, int modelo, int serie, int codCliente)
        {
            await using var con = Conn();
            await con.OpenAsync();

            NotasSaidas? nota;
            await using (var cmd = new MySqlCommand($@"{SelectBase}
                WHERE n.numero = @numero AND n.modelo = @modelo
                  AND n.serie = @serie AND n.codCliente = @codCliente", con))
            {
                cmd.Parameters.AddWithValue("@numero", numero);
                cmd.Parameters.AddWithValue("@modelo", modelo);
                cmd.Parameters.AddWithValue("@serie", serie);
                cmd.Parameters.AddWithValue("@codCliente", codCliente);
                await using var rd = await cmd.ExecuteReaderAsync();
                nota = await rd.ReadAsync() ? Map(rd) : null;
            }

            if (nota is null)
                return null;

            nota.Produtos = (await GetItensAsync(con, numero, modelo, serie, codCliente)).ToList();
            return nota;
        }

        private static async Task<IEnumerable<ProdutosNotaSaida>> GetItensAsync(
            MySqlConnection con, int numero, int modelo, int serie, int codCliente)
        {
            var list = new List<ProdutosNotaSaida>();
            await using var cmd = new MySqlCommand(SelectItens, con);
            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@codCliente", codCliente);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(MapItem(rd));
            return list;
        }

        public async Task<NotasSaidas> CreateAsync(NotasSaidas body)
        {
            body.Situacao = "PENDENTE";

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                await using (var cmd = new MySqlCommand(@"
                    INSERT INTO notasSaida
                        (numero, serie, modelo, codCliente, dataEmissao, dataSaida, tipoFrete,
                         valorProdutos, valorFrete, valorSeguro, outrasDespesas, valorDesconto,
                         valorTotal, codCondicao, codTransp, placaVeiculo, observacoes, situacao)
                    VALUES
                        (@numero, @serie, @modelo, @codCliente, @dataEmissao, @dataSaida, @tipoFrete,
                         @valorProdutos, @valorFrete, @valorSeguro, @outrasDespesas, @valorDesconto,
                         @valorTotal, @codCondicao, @codTransp, @placaVeiculo, @observacoes, @situacao)",
                    con, tx))
                {
                    AddParams(cmd, body);
                    await cmd.ExecuteNonQueryAsync();
                }

                foreach (var item in body.Produtos)
                    await InserirItemAsync(con, tx, body.Numero, body.Modelo, body.Serie, body.CodCliente, item);

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync("NotasSaida", "CRIOU",
                $"Criou Nota de Saida: Nº {body.Numero}/{body.Serie} (Modelo {body.Modelo}) - " +
                $"Cliente {body.CodCliente} com {body.Produtos.Count} item(ns)");

            return body;
        }

        public async Task UpdateAsync(NotasSaidas body)
        {
            var antes = await GetByIdAsync(body.Numero, body.Modelo, body.Serie, body.CodCliente);

            if (antes is null)
                throw new InvalidOperationException("Nota de saida não encontrada.");

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
                    UPDATE notasSaida SET
                        dataEmissao = @dataEmissao,
                        dataSaida = @dataSaida,
                        tipoFrete = @tipoFrete,
                        valorProdutos = @valorProdutos,
                        valorFrete = @valorFrete,
                        valorSeguro = @valorSeguro,
                        outrasDespesas = @outrasDespesas,
                        valorDesconto = @valorDesconto,
                        valorTotal = @valorTotal,
                        codCondicao = @codCondicao,
                        codTransp = @codTransp,
                        placaVeiculo = @placaVeiculo,
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
                    DELETE FROM produtosNotaSaida
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codCliente = @codCliente", con, tx))
                {
                    delCmd.Parameters.AddWithValue("@numero", body.Numero);
                    delCmd.Parameters.AddWithValue("@modelo", body.Modelo);
                    delCmd.Parameters.AddWithValue("@serie", body.Serie);
                    delCmd.Parameters.AddWithValue("@codCliente", body.CodCliente);
                    await delCmd.ExecuteNonQueryAsync();
                }

                foreach (var item in body.Produtos)
                    await InserirItemAsync(con, tx, body.Numero, body.Modelo, body.Serie, body.CodCliente, item);

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            var mudancas = new List<string>();

            if (antes?.Situacao != body.Situacao)
                mudancas.Add($"Situação: {body.Situacao} (Era {antes?.Situacao})");

            if (antes?.ValorTotal != body.ValorTotal)
                mudancas.Add($"Valor Total: {body.ValorTotal:C} (Era {antes?.ValorTotal:C})");

            if (antes?.DataSaida != body.DataSaida)
                mudancas.Add($"Data Saida: {body.DataSaida:d} (Era {antes?.DataSaida:d})");

            if (antes?.CodTransp != body.CodTransp)
                mudancas.Add($"Transportadora: {body.CodTransp} (Era {antes?.CodTransp})");

            if (antes?.CodCondicao != body.CodCondicao)
                mudancas.Add($"Condição Pagamento: {body.CodCondicao} (Era {antes?.CodCondicao})");

            if (antes?.Produtos.Count != body.Produtos.Count)
                mudancas.Add($"Itens: {body.Produtos.Count} (Era {antes?.Produtos.Count})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";

            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Nota de Saida: Nº {body.Numero}/{body.Serie}"
                : $"Editou Nota de Saida: Nº {body.Numero}/{body.Serie}. {diff}";

            await log.AddAsync("NotasSaida", "EDITOU", desc);
        }

        public async Task ConfirmarAsync(int numero, int modelo, int serie, int codCliente)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                string situacao;

                await using (var cmd = new MySqlCommand(@"
                    SELECT situacao
                    FROM notasSaida
                    WHERE numero = @numero
                      AND modelo = @modelo
                      AND serie = @serie
                      AND codCliente = @codCliente
                    FOR UPDATE", con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codCliente", codCliente);

                    var result = await cmd.ExecuteScalarAsync();

                    if (result is null)
                        throw new InvalidOperationException("Nota de saida não encontrada.");

                    situacao = result.ToString() ?? "";
                }

                if (!string.Equals(situacao, "PENDENTE", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException(
                        $"A nota não pode ser confirmada porque está com situação {situacao}.");

                var itens = new List<ProdutosNotaSaida>();

                await using (var cmd = new MySqlCommand(SelectItens, con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codCliente", codCliente);

                    await using var rd = await cmd.ExecuteReaderAsync();

                    while (await rd.ReadAsync())
                        itens.Add(MapItem(rd));
                }

                if (itens.Count == 0)
                    throw new InvalidOperationException(
                        "A nota não pode ser confirmada porque não possui produtos.");

                int? codCondicao;
                decimal valorTotal;
                DateTime dataEmissao;

                await using (var cmd = new MySqlCommand(@"
                    SELECT codCondicao, valorTotal, dataEmissao
                    FROM notasSaida
                    WHERE numero = @numero
                      AND modelo = @modelo
                      AND serie = @serie
                      AND codCliente = @codCliente", con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codCliente", codCliente);

                    await using var rd = await cmd.ExecuteReaderAsync();

                    if (!await rd.ReadAsync())
                        throw new InvalidOperationException("Nota de saida não encontrada.");

                    codCondicao = rd.IsDBNull(rd.GetOrdinal("codCondicao"))
                        ? null
                        : rd.GetInt32(rd.GetOrdinal("codCondicao"));
                    valorTotal = rd.GetDecimal(rd.GetOrdinal("valorTotal"));
                    dataEmissao = rd.GetDateTime(rd.GetOrdinal("dataEmissao"));
                }

                foreach (var item in itens)
                {
                    if (item.Quantidade <= 0)
                        throw new InvalidOperationException(
                            $"A quantidade do produto {item.CodProd} deve ser maior que zero.");

                    var custoUnitario = item.CustoFinal > 0
                        ? item.CustoFinal
                        : item.ValorUnitario;

                    if (custoUnitario <= 0)
                        throw new InvalidOperationException(
                            $"O custo do produto {item.CodProd} deve ser maior que zero.");

                    await MovimentoEstoqueRepository.RegistrarSaidaAsync(
                        con,
                        tx,
                        numero,
                        modelo,
                        serie,
                        codCliente,
                        item.CodProd,
                        item.Quantidade,
                        $"Saida da Nota {numero}/{serie} - Cliente {codCliente}");
                }

                await ContaReceberRepository.GerarContasDaNotaAsync(
                    con,
                    tx,
                    numero,
                    modelo,
                    serie,
                    codCliente,
                    codCondicao,
                    valorTotal,
                    dataEmissao);

                await using (var cmd = new MySqlCommand(@"
                    UPDATE notasSaida
                    SET situacao = 'CONFERIDA',
                        dataSaida = COALESCE(dataSaida, CURRENT_DATE)
                    WHERE numero = @numero
                      AND modelo = @modelo
                      AND serie = @serie
                      AND codCliente = @codCliente
                      AND situacao = 'PENDENTE'", con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codCliente", codCliente);

                    var alteradas = await cmd.ExecuteNonQueryAsync();

                    if (alteradas != 1)
                        throw new InvalidOperationException(
                            "Não foi possível confirmar a nota de saida.");
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync("NotasSaida", "CONFIRMOU",
                $"Conferiu Nota de Saida: Nº {numero}/{serie} (Modelo {modelo}) - Cliente {codCliente}");
        }

        public async Task DeleteAsync(int numero, int modelo, int serie, int codCliente)
        {
            var nota = await GetByIdAsync(numero, modelo, serie, codCliente);

            if (nota is null)
                throw new InvalidOperationException("Nota de saida não encontrada.");

            if (!string.Equals(nota.Situacao, "PENDENTE", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    $"A nota está com situação {nota.Situacao} e não pode ser excluída.");

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                await using (var cmd = new MySqlCommand(@"
                    DELETE FROM notasSaida
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codCliente = @codCliente", con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codCliente", codCliente);
                    await cmd.ExecuteNonQueryAsync();
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync("NotasSaida", "EXCLUIU",
                $"Excluiu Nota de Saida: Nº {numero}/{serie} (Modelo {modelo}) - Cliente {codCliente}");
        }

        private static async Task InserirItemAsync(
            MySqlConnection con, MySqlTransaction tx,
            int numero, int modelo, int serie, int codCliente, ProdutosNotaSaida item)
        {
            await using var cmd = new MySqlCommand(@"
                INSERT INTO produtosNotaSaida
                    (numero, modelo, serie, codCliente, codProd, quantidade, valorUnitario, valorTotal,
                     descontoPercentual, descontoValor, rateioFrete, rateioSeguro, rateioOutras, custoFinal)
                VALUES
                    (@numero, @modelo, @serie, @codCliente, @codProd, @quantidade, @valorUnitario, @valorTotal,
                     @descontoPercentual, @descontoValor, @rateioFrete, @rateioSeguro, @rateioOutras, @custoFinal)",
                con, tx);

            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@codCliente", codCliente);
            cmd.Parameters.AddWithValue("@codProd", item.CodProd);
            cmd.Parameters.AddWithValue("@quantidade", item.Quantidade);
            cmd.Parameters.AddWithValue("@valorUnitario", item.ValorUnitario);
            cmd.Parameters.AddWithValue("@valorTotal", item.ValorTotal);
            cmd.Parameters.AddWithValue("@descontoPercentual", item.DescontoPercentual);
            cmd.Parameters.AddWithValue("@descontoValor", item.DescontoValor);
            cmd.Parameters.AddWithValue("@rateioFrete", item.RateioFrete);
            cmd.Parameters.AddWithValue("@rateioSeguro", item.RateioSeguro);
            cmd.Parameters.AddWithValue("@rateioOutras", item.RateioOutras);
            cmd.Parameters.AddWithValue("@custoFinal", item.CustoFinal);

            await cmd.ExecuteNonQueryAsync();
        }

        private static void AddParams(MySqlCommand cmd, NotasSaidas n)
        {
            cmd.Parameters.AddWithValue("@numero", n.Numero);
            cmd.Parameters.AddWithValue("@serie", n.Serie);
            cmd.Parameters.AddWithValue("@modelo", n.Modelo);
            cmd.Parameters.AddWithValue("@codCliente", n.CodCliente);
            cmd.Parameters.AddWithValue("@dataEmissao", n.DataEmissao);
            cmd.Parameters.AddWithValue("@dataSaida", (object?)n.DataSaida ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@tipoFrete", n.TipoFrete);
            cmd.Parameters.AddWithValue("@valorProdutos", n.ValorProdutos);
            cmd.Parameters.AddWithValue("@valorFrete", n.ValorFrete);
            cmd.Parameters.AddWithValue("@valorSeguro", n.ValorSeguro);
            cmd.Parameters.AddWithValue("@outrasDespesas", n.OutrasDespesas);
            cmd.Parameters.AddWithValue("@valorDesconto", n.ValorDesconto);
            cmd.Parameters.AddWithValue("@valorTotal", n.ValorTotal);
            cmd.Parameters.AddWithValue("@codCondicao", (object?)n.CodCondicao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@codTransp", (object?)n.CodTransp ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@placaVeiculo", (object?)n.PlacaVeiculo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@observacoes", (object?)n.Observacoes ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@situacao", n.Situacao);
        }

        static NotasSaidas Map(MySqlDataReader rd) => new()
        {
            Numero = rd.GetInt32("numero"),
            Serie = rd.GetInt32("serie"),
            Modelo = rd.GetInt32("modelo"),
            CodCliente = rd.GetInt32("codCliente"),
            DataEmissao = rd.GetDateTime("dataEmissao"),
            DataSaida = rd.IsDBNull(rd.GetOrdinal("dataSaida")) ? null : rd.GetDateTime("dataSaida"),
            TipoFrete = rd.GetString("tipoFrete"),
            ValorProdutos = rd.GetDecimal("valorProdutos"),
            ValorFrete = rd.GetDecimal("valorFrete"),
            ValorSeguro = rd.GetDecimal("valorSeguro"),
            OutrasDespesas = rd.GetDecimal("outrasDespesas"),
            ValorDesconto = rd.GetDecimal("valorDesconto"),
            ValorTotal = rd.GetDecimal("valorTotal"),
            CodCondicao = rd.IsDBNull(rd.GetOrdinal("codCondicao")) ? null : rd.GetInt32("codCondicao"),
            CodTransp = rd.IsDBNull(rd.GetOrdinal("codTransp")) ? null : rd.GetInt32("codTransp"),
            PlacaVeiculo = rd.IsDBNull(rd.GetOrdinal("placaVeiculo")) ? null : rd.GetString("placaVeiculo"),
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
                CodCondicao = rd.GetInt32("CodCondicao"),
                CondicaoPagamento = rd.IsDBNull(rd.GetOrdinal("CondicaoDescricao"))
                    ? null
                    : rd.GetString("CondicaoDescricao"),
            },

            Transportador = rd.IsDBNull(rd.GetOrdinal("Transportador")) ? null : new Transportadores
            {
                CodTransp = rd.GetInt32("CodTransp"),
                Transportador = rd.IsDBNull(rd.GetOrdinal("Transportador"))
                    ? null
                    : rd.GetString("Transportador"),
                Ativo = !rd.IsDBNull(rd.GetOrdinal("TransportadorAtivo")) && rd.GetBoolean("TransportadorAtivo"),
            }
        };

        static ProdutosNotaSaida MapItem(MySqlDataReader rd) => new()
        {
            Numero = rd.GetInt32("numero"),
            Modelo = rd.GetInt32("modelo"),
            Serie = rd.GetInt32("serie"),
            CodCliente = rd.GetInt32("codCliente"),
            CodProd = rd.GetInt32("codProd"),
            Quantidade = rd.GetInt32("quantidade"),
            ValorUnitario = rd.GetDecimal("valorUnitario"),
            ValorTotal = rd.GetDecimal("valorTotal"),

            DescontoPercentual = rd.IsDBNull(rd.GetOrdinal("descontoPercentual"))
                ? 0
                : rd.GetDecimal("descontoPercentual"),

            DescontoValor = rd.IsDBNull(rd.GetOrdinal("descontoValor"))
                ? 0
                : rd.GetDecimal("descontoValor"),

            RateioFrete = rd.IsDBNull(rd.GetOrdinal("rateioFrete"))
                ? 0
                : rd.GetDecimal("rateioFrete"),

            RateioSeguro = rd.IsDBNull(rd.GetOrdinal("rateioSeguro"))
                ? 0
                : rd.GetDecimal("rateioSeguro"),

            RateioOutras = rd.IsDBNull(rd.GetOrdinal("rateioOutras"))
                ? 0
                : rd.GetDecimal("rateioOutras"),

            CustoFinal = rd.IsDBNull(rd.GetOrdinal("custoFinal"))
                ? 0
                : rd.GetDecimal("custoFinal"),

            Produto = rd.IsDBNull(rd.GetOrdinal("Produto")) ? null : new Produtos
            {
                CodProd = rd.GetInt32("CodProd"),
                Produto = rd.GetString("Produto"),
                Unidade = rd.IsDBNull(rd.GetOrdinal("ProdutoUnidade")) ? null : rd.GetString("ProdutoUnidade"),
                Ativo = !rd.IsDBNull(rd.GetOrdinal("ProdutoAtivo")) && rd.GetBoolean("ProdutoAtivo"),
            }
        };
    }
}