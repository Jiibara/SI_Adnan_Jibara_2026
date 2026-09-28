using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class ContaReceberRepository(IConfiguration cfg)
    {
        private readonly string _cs = cfg.GetConnectionString("DefaultConnection")!;

        public async Task<List<ContasReceber>> GetAllAsync()
        {
            var lista = new List<ContasReceber>();

            await using var con = new MySqlConnection(_cs);
            await con.OpenAsync();

            const string sql = """
                SELECT cp.*,
                       c.CodCliente AS ClienteCodCliente,
                       c.Cliente,
                       c.Ativo AS ClienteAtivo
                FROM contasReceber cp
                LEFT JOIN clientes c ON c.CodCliente = cp.codCliente
                ORDER BY cp.dataVencimento, cp.notaNumero, cp.notaSerie, cp.notaModelo, cp.numeroParcela
                """;

            await using var cmd = new MySqlCommand(sql, con);
            await using var rd = await cmd.ExecuteReaderAsync();

            while (await rd.ReadAsync())
                lista.Add(Map(rd));

            return lista;
        }

        public async Task<List<ContasReceber>> GetByNotaAsync(int numero, int modelo, int serie, int codCliente)
        {
            var lista = new List<ContasReceber>();

            await using var con = new MySqlConnection(_cs);
            await con.OpenAsync();

            const string sql = """
                SELECT cp.*,
                       c.CodCliente AS ClienteCodCliente,
                       c.Cliente,
                       c.Ativo AS ClienteAtivo
                FROM contasReceber cp
                LEFT JOIN clientes c ON c.CodCliente = cp.codCliente
                WHERE cp.notaNumero = @numero
                  AND cp.notaModelo = @modelo
                  AND cp.notaSerie = @serie
                  AND cp.codCliente = @codCliente
                ORDER BY cp.numeroParcela
                """;

            await using var cmd = new MySqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@codCliente", codCliente);

            await using var rd = await cmd.ExecuteReaderAsync();

            while (await rd.ReadAsync())
                lista.Add(Map(rd));

            return lista;
        }

        public async Task<ContasReceber?> GetByIdAsync(int numero, int modelo, int serie, int codCliente, int numeroParcela)
        {
            await using var con = new MySqlConnection(_cs);
            await con.OpenAsync();

            const string sql = """
                SELECT cp.*,
                       c.CodCliente AS ClienteCodCliente,
                       c.Cliente,
                       c.Ativo AS ClienteAtivo
                FROM contasReceber cp
                LEFT JOIN clientes c ON c.CodCliente = cp.codCliente
                WHERE cp.notaNumero = @numero
                  AND cp.notaModelo = @modelo
                  AND cp.notaSerie = @serie
                  AND cp.codCliente = @codCliente
                  AND cp.numeroParcela = @numeroParcela
                """;

            await using var cmd = new MySqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@codCliente", codCliente);
            cmd.Parameters.AddWithValue("@numeroParcela", numeroParcela);

            await using var rd = await cmd.ExecuteReaderAsync();

            if (!await rd.ReadAsync())
                return null;

            return Map(rd);
        }

        public async Task ReceberAsync(int numero, int modelo, int serie, int codCliente, int numeroParcela, ContasReceber pagamento)
        {
            if (!pagamento.DataRecebimento.HasValue)
                throw new InvalidOperationException("A data do recebimento é obrigatória.");

            if (pagamento.ValorDesconto < 0 || pagamento.ValorJuros < 0 || pagamento.ValorMulta < 0)
                throw new InvalidOperationException("Desconto, juros e multa não podem ser negativos.");

            await using var con = new MySqlConnection(_cs);
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                decimal valorOriginal;
                string situacao;

                await using (var cmd = new MySqlCommand(@"
                    SELECT valorOriginal, situacao
                    FROM contasReceber
                    WHERE notaNumero = @numero
                      AND notaModelo = @modelo
                      AND notaSerie = @serie
                      AND codCliente = @codCliente
                      AND numeroParcela = @numeroParcela
                    FOR UPDATE", con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codCliente", codCliente);
                    cmd.Parameters.AddWithValue("@numeroParcela", numeroParcela);

                    await using var rd = await cmd.ExecuteReaderAsync();

                    if (!await rd.ReadAsync())
                        throw new InvalidOperationException("Conta a receber não encontrada.");

                    valorOriginal = rd.GetDecimal(rd.GetOrdinal("valorOriginal"));
                    situacao = rd.GetString(rd.GetOrdinal("situacao"));
                }

                if (!string.Equals(situacao, "PENDENTE", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException(
                        $"A conta a receber não pode ser paga porque está com situação {situacao}.");

                var valorTotal = Math.Round(
                    valorOriginal - pagamento.ValorDesconto + pagamento.ValorJuros + pagamento.ValorMulta,
                    2,
                    MidpointRounding.AwayFromZero);

                if (valorTotal <= 0)
                    throw new InvalidOperationException("O valor final do recebimento deve ser maior que zero.");

                var valorRecebido = valorTotal;

                await using (var cmd = new MySqlCommand(@"
                    UPDATE contasReceber
                    SET valorRecebido = @valorRecebido,
                        valorDesconto = @valorDesconto,
                        valorJuros = @valorJuros,
                        valorMulta = @valorMulta,
                        valorTotal = @valorTotal,
                        dataRecebimento = @dataRecebimento,
                        codFormaPagamento = @codFormaPagamento,
                        situacao = 'RECEBIDO'
                    WHERE notaNumero = @numero
                      AND notaModelo = @modelo
                      AND notaSerie = @serie
                      AND codCliente = @codCliente
                      AND numeroParcela = @numeroParcela
                      AND situacao = 'PENDENTE'", con, tx))
                {
                    cmd.Parameters.AddWithValue("@valorRecebido", valorRecebido);
                    cmd.Parameters.AddWithValue("@valorDesconto", pagamento.ValorDesconto);
                    cmd.Parameters.AddWithValue("@valorJuros", pagamento.ValorJuros);
                    cmd.Parameters.AddWithValue("@valorMulta", pagamento.ValorMulta);
                    cmd.Parameters.AddWithValue("@valorTotal", valorTotal);
                    cmd.Parameters.AddWithValue("@dataRecebimento", pagamento.DataRecebimento.Value.Date);
                    cmd.Parameters.AddWithValue("@codFormaPagamento", (object?)pagamento.CodFormaPagamento ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codCliente", codCliente);
                    cmd.Parameters.AddWithValue("@numeroParcela", numeroParcela);

                    var alteradas = await cmd.ExecuteNonQueryAsync();

                    if (alteradas != 1)
                        throw new InvalidOperationException("Não foi possível registrar o recebimento.");
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public static async Task GerarContasDaNotaAsync(
            MySqlConnection con,
            MySqlTransaction tx,
            int numero,
            int modelo,
            int serie,
            int codCliente,
            int? codCondicao,
            decimal valorTotal,
            DateTime dataEmissao)
        {
            if (!codCondicao.HasValue)
                throw new InvalidOperationException("A nota de saida não possui uma condição de pagamento.");

            if (valorTotal <= 0)
                throw new InvalidOperationException("O valor total da nota deve ser maior que zero.");

            const string sqlExistente = """
                SELECT COUNT(*)
                FROM contasReceber
                WHERE notaNumero = @numero
                  AND notaModelo = @modelo
                  AND notaSerie = @serie
                  AND codCliente = @codCliente
                """;

            await using (var cmdExistente = new MySqlCommand(sqlExistente, con, tx))
            {
                cmdExistente.Parameters.AddWithValue("@numero", numero);
                cmdExistente.Parameters.AddWithValue("@modelo", modelo);
                cmdExistente.Parameters.AddWithValue("@serie", serie);
                cmdExistente.Parameters.AddWithValue("@codCliente", codCliente);

                var existentes = Convert.ToInt32(await cmdExistente.ExecuteScalarAsync());

                if (existentes > 0)
                    throw new InvalidOperationException("Já existem contas a receber geradas para esta nota.");
            }

            decimal percentualJuros;
            decimal percentualMulta;
            decimal percentualDesconto;

            const string sqlCondicao = """
                SELECT percentualJuros,
                       percentualMultas,
                       percentualDesconto
                FROM condicaopagamentos
                WHERE codCondicao = @codCondicao
                """;

            await using (var cmdCondicao = new MySqlCommand(sqlCondicao, con, tx))
            {
                cmdCondicao.Parameters.AddWithValue("@codCondicao", codCondicao.Value);

                await using var rdCondicao = await cmdCondicao.ExecuteReaderAsync();

                if (!await rdCondicao.ReadAsync())
                    throw new InvalidOperationException("A condição de pagamento informada não foi encontrada.");

                percentualJuros = rdCondicao.IsDBNull(rdCondicao.GetOrdinal("percentualJuros"))
                    ? 0
                    : rdCondicao.GetDecimal(rdCondicao.GetOrdinal("percentualJuros"));

                percentualMulta = rdCondicao.IsDBNull(rdCondicao.GetOrdinal("percentualMultas"))
                    ? 0
                    : rdCondicao.GetDecimal(rdCondicao.GetOrdinal("percentualMultas"));

                percentualDesconto = rdCondicao.IsDBNull(rdCondicao.GetOrdinal("percentualDesconto"))
                    ? 0
                    : rdCondicao.GetDecimal(rdCondicao.GetOrdinal("percentualDesconto"));
            }

            var parcelas = new List<(int NumeroParcela, decimal Percentual, int Dias, int? CodFormaPagamento)>();

            const string sqlParcelas = """
                SELECT numeroParcela,
                       percentual,
                       dias,
                       codFormaPagamento
                FROM Parcelas
                WHERE codCondicao = @codCondicao
                ORDER BY numeroParcela
                """;

            await using (var cmdParcelas = new MySqlCommand(sqlParcelas, con, tx))
            {
                cmdParcelas.Parameters.AddWithValue("@codCondicao", codCondicao.Value);

                await using var rdParcelas = await cmdParcelas.ExecuteReaderAsync();

                while (await rdParcelas.ReadAsync())
                {
                    parcelas.Add((
                        rdParcelas.GetInt32(rdParcelas.GetOrdinal("numeroParcela")),
                        rdParcelas.GetDecimal(rdParcelas.GetOrdinal("percentual")),
                        rdParcelas.GetInt32(rdParcelas.GetOrdinal("dias")),
                        rdParcelas.IsDBNull(rdParcelas.GetOrdinal("codFormaPagamento"))
                            ? null
                            : rdParcelas.GetInt32(rdParcelas.GetOrdinal("codFormaPagamento"))
                    ));
                }
            }

            if (parcelas.Count == 0)
                throw new InvalidOperationException("A condição de pagamento não possui parcelas configuradas.");

            var somaPercentuais = parcelas.Sum(x => x.Percentual);

            if (Math.Abs(somaPercentuais - 100m) > 0.01m)
                throw new InvalidOperationException($"Os percentuais das parcelas devem totalizar 100%. Total atual: {somaPercentuais:N2}%.");

            decimal valorRestante = Math.Round(valorTotal, 2);

            for (var i = 0; i < parcelas.Count; i++)
            {
                var parcela = parcelas[i];

                decimal valorParcela;

                if (i == parcelas.Count - 1)
                    valorParcela = valorRestante;
                else
                    valorParcela = Math.Round(valorTotal * parcela.Percentual / 100m, 2);

                valorRestante -= valorParcela;

                var dataVencimento = dataEmissao.Date.AddDays(parcela.Dias);

                await using var cmdInsert = new MySqlCommand(@"
                    INSERT INTO contasReceber
                        (notaNumero, notaModelo, notaSerie, codCliente, numeroParcela, totalParcelas,
                         valorOriginal, valorRecebido, valorDesconto, valorJuros, valorMulta,
                         percentualJuros, percentualMulta, percentualDesconto, valorTotal,
                         dataEmissao, dataVencimento, dataRecebimento, codFormaPagamento,
                         situacao, observacoes)
                    VALUES
                        (@notaNumero, @notaModelo, @notaSerie, @codCliente, @numeroParcela, @totalParcelas,
                         @valorOriginal, 0.00, 0.00, 0.00, 0.00,
                         @percentualJuros, @percentualMulta, @percentualDesconto, @valorTotal,
                         @dataEmissao, @dataVencimento, NULL, @codFormaPagamento,
                         'PENDENTE', NULL);
                    ", con, tx);

                cmdInsert.Parameters.AddWithValue("@notaNumero", numero);
                cmdInsert.Parameters.AddWithValue("@notaModelo", modelo);
                cmdInsert.Parameters.AddWithValue("@notaSerie", serie);
                cmdInsert.Parameters.AddWithValue("@codCliente", codCliente);
                cmdInsert.Parameters.AddWithValue("@numeroParcela", parcela.NumeroParcela);
                cmdInsert.Parameters.AddWithValue("@totalParcelas", parcelas.Count);
                cmdInsert.Parameters.AddWithValue("@valorOriginal", valorParcela);
                cmdInsert.Parameters.AddWithValue("@percentualJuros", percentualJuros);
                cmdInsert.Parameters.AddWithValue("@percentualMulta", percentualMulta);
                cmdInsert.Parameters.AddWithValue("@percentualDesconto", percentualDesconto);
                cmdInsert.Parameters.AddWithValue("@valorTotal", valorParcela);
                cmdInsert.Parameters.AddWithValue("@dataEmissao", dataEmissao.Date);
                cmdInsert.Parameters.AddWithValue("@dataVencimento", dataVencimento);
                cmdInsert.Parameters.AddWithValue("@codFormaPagamento", (object?)parcela.CodFormaPagamento ?? DBNull.Value);

                await cmdInsert.ExecuteNonQueryAsync();
            }
        }

        private static ContasReceber Map(MySqlDataReader rd)
        {
            var conta = new ContasReceber
            {
                NotaNumero = rd.GetInt32(rd.GetOrdinal("notaNumero")),
                NotaModelo = rd.GetInt32(rd.GetOrdinal("notaModelo")),
                NotaSerie = rd.GetInt32(rd.GetOrdinal("notaSerie")),
                CodCliente = rd.GetInt32(rd.GetOrdinal("codCliente")),
                NumeroParcela = rd.GetInt32(rd.GetOrdinal("numeroParcela")),
                TotalParcelas = rd.GetInt32(rd.GetOrdinal("totalParcelas")),
                ValorOriginal = rd.GetDecimal(rd.GetOrdinal("valorOriginal")),
                ValorRecebido = rd.GetDecimal(rd.GetOrdinal("valorRecebido")),
                ValorDesconto = rd.GetDecimal(rd.GetOrdinal("valorDesconto")),
                ValorJuros = rd.GetDecimal(rd.GetOrdinal("valorJuros")),
                ValorMulta = rd.GetDecimal(rd.GetOrdinal("valorMulta")),
                PercentualJuros = rd.GetDecimal(rd.GetOrdinal("percentualJuros")),
                PercentualMulta = rd.GetDecimal(rd.GetOrdinal("percentualMulta")),
                PercentualDesconto = rd.GetDecimal(rd.GetOrdinal("percentualDesconto")),
                ValorTotal = rd.GetDecimal(rd.GetOrdinal("valorTotal")),
                DataEmissao = rd.GetDateTime(rd.GetOrdinal("dataEmissao")),
                DataVencimento = rd.GetDateTime(rd.GetOrdinal("dataVencimento")),
                DataRecebimento = rd.IsDBNull(rd.GetOrdinal("dataRecebimento"))
                    ? null
                    : rd.GetDateTime(rd.GetOrdinal("dataRecebimento")),
                CodFormaPagamento = rd.IsDBNull(rd.GetOrdinal("codFormaPagamento"))
                    ? null
                    : rd.GetInt32(rd.GetOrdinal("codFormaPagamento")),
                Situacao = rd.GetString(rd.GetOrdinal("situacao")),
                Observacoes = rd.IsDBNull(rd.GetOrdinal("observacoes"))
                    ? null
                    : rd.GetString(rd.GetOrdinal("observacoes"))
            };

            var clienteOrdinal = rd.GetOrdinal("Cliente");

            if (!rd.IsDBNull(clienteOrdinal))
            {
                conta.Cliente = new Clientes
                {
                    CodCliente = rd.GetInt32(rd.GetOrdinal("ClienteCodCliente")),
                    Cliente = rd.GetString(clienteOrdinal),
                    Ativo = !rd.IsDBNull(rd.GetOrdinal("ClienteAtivo"))
                        && rd.GetBoolean(rd.GetOrdinal("ClienteAtivo"))
                };
            }

            return conta;
        }
    }
}
