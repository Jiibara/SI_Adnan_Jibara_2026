using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class ContaPagarAvulsaRepository(IConfiguration cfg, LogRepository log)
    {
        private readonly string _cs = cfg.GetConnectionString("DefaultConnection")!;

        private MySqlConnection Conn() => new(_cs);

        private static readonly string[] SituacoesValidas =
            ["PENDENTE", "PARCIAL", "PAGA", "VENCIDA", "CANCELADA"];

        private const string SelectBase = @"
            SELECT
                cpa.notaNumero,
                cpa.notaModelo,
                cpa.notaSerie,
                cpa.codForn,
                cpa.numeroParcela,
                cpa.totalParcelas,
                cpa.valorOriginal,
                cpa.valorPago,
                cpa.valorDesconto,
                cpa.valorJuros,
                cpa.valorMulta,
                cpa.percentualJuros,
                cpa.percentualMulta,
                cpa.percentualDesconto,
                cpa.valorTotal,
                cpa.dataEmissao,
                cpa.dataVencimento,
                cpa.dataPagamento,
                cpa.codFormaPagamento,
                cpa.codCondicao,
                cpa.situacao,
                cpa.observacoes
            FROM contasPagarAvulsa cpa";

        // ---------------------------------------------------------------
        // Consultas
        // ---------------------------------------------------------------

        public async Task<List<ContasPagarAvulsa>> GetAllAsync()
        {
            var lista = new List<ContasPagarAvulsa>();

            await using var con = Conn();
            await con.OpenAsync();

            await using var cmd = new MySqlCommand(
                SelectBase + @"
                ORDER BY cpa.dataVencimento, cpa.notaNumero, cpa.numeroParcela",
                con);

            await using var rd = await cmd.ExecuteReaderAsync();

            while (await rd.ReadAsync())
                lista.Add(Map(rd));

            return lista;
        }

        public async Task<ContasPagarAvulsa?> GetByIdAsync(
            string notaNumero,
            string notaModelo,
            string notaSerie,
            int codForn,
            int numeroParcela)
        {
            await using var con = Conn();
            await con.OpenAsync();

            await using var cmd = new MySqlCommand(
                SelectBase + @"
                WHERE cpa.notaNumero = @notaNumero
                  AND cpa.notaModelo = @notaModelo
                  AND cpa.notaSerie = @notaSerie
                  AND cpa.codForn = @codForn
                  AND cpa.numeroParcela = @numeroParcela",
                con);

            AddChave(cmd, notaNumero, notaModelo, notaSerie, codForn, numeroParcela);

            await using var rd = await cmd.ExecuteReaderAsync();

            return await rd.ReadAsync() ? Map(rd) : null;
        }

        public async Task<List<ContasPagarAvulsa>> GetByFornecedorAsync(int codForn)
        {
            var lista = new List<ContasPagarAvulsa>();

            await using var con = Conn();
            await con.OpenAsync();

            await using var cmd = new MySqlCommand(
                SelectBase + @"
                WHERE cpa.codForn = @codForn
                ORDER BY cpa.dataVencimento, cpa.notaNumero, cpa.numeroParcela",
                con);

            cmd.Parameters.AddWithValue("@codForn", codForn);

            await using var rd = await cmd.ExecuteReaderAsync();

            while (await rd.ReadAsync())
                lista.Add(Map(rd));

            return lista;
        }

        // ---------------------------------------------------------------
        // Escrita
        // ---------------------------------------------------------------

        public async Task<ContasPagarAvulsa> CreateAsync(ContasPagarAvulsa body)
        {
            Normalizar(body);
            Validar(body);

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                await InserirAsync(con, tx, body);
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync(
                "ContasPagarAvulsa",
                "CRIOU",
                $"Criou Conta a Pagar Avulsa: Nº {body.NotaNumero}/{body.NotaSerie} " +
                $"(modelo {body.NotaModelo}) - Fornecedor {body.CodForn} - " +
                $"Parcela {body.NumeroParcela}/{body.TotalParcelas}.");

            return body;
        }

        /// <summary>
        /// Cria todas as parcelas de uma conta em uma única transação:
        /// ou entram todas, ou nenhuma.
        /// </summary>
        public async Task<List<ContasPagarAvulsa>> CreateManyAsync(IReadOnlyList<ContasPagarAvulsa> contas)
        {
            if (contas is null || contas.Count == 0)
                throw new InvalidOperationException("Informe ao menos uma parcela.");

            foreach (var c in contas)
            {
                Normalizar(c);
                Validar(c);
            }

            var primeira = contas[0];

            if (contas.Any(c =>
                    c.NotaNumero != primeira.NotaNumero ||
                    c.NotaModelo != primeira.NotaModelo ||
                    c.NotaSerie != primeira.NotaSerie ||
                    c.CodForn != primeira.CodForn ||
                    c.TotalParcelas != primeira.TotalParcelas))
                throw new InvalidOperationException("Todas as parcelas devem pertencer à mesma nota e fornecedor.");

            if (contas.Select(c => c.NumeroParcela).Distinct().Count() != contas.Count)
                throw new InvalidOperationException("Há parcelas com o mesmo número.");

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                foreach (var c in contas)
                    await InserirAsync(con, tx, c);

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync(
                "ContasPagarAvulsa",
                "CRIOU",
                $"Criou Conta a Pagar Avulsa: Nº {primeira.NotaNumero}/{primeira.NotaSerie} " +
                $"(modelo {primeira.NotaModelo}) - Fornecedor {primeira.CodForn} - " +
                $"{contas.Count} parcela(s).");

            return contas.ToList();
        }

        public async Task UpdateAsync(ContasPagarAvulsa body)
        {
            Normalizar(body);
            Validar(body);

            var existente = await GetByIdAsync(
                body.NotaNumero,
                body.NotaModelo,
                body.NotaSerie,
                body.CodForn,
                body.NumeroParcela);

            if (existente is null)
                throw new InvalidOperationException("Conta a pagar avulsa não encontrada.");

            if (string.Equals(existente.Situacao, "PAGA", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Uma conta paga não pode ser editada.");

            if (string.Equals(existente.Situacao, "CANCELADA", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Uma conta cancelada não pode ser editada.");

            await using var con = Conn();
            await con.OpenAsync();

            await using var cmd = new MySqlCommand(@"
                UPDATE contasPagarAvulsa
                SET totalParcelas = @totalParcelas,
                    valorOriginal = @valorOriginal,
                    valorPago = @valorPago,
                    valorDesconto = @valorDesconto,
                    valorJuros = @valorJuros,
                    valorMulta = @valorMulta,
                    percentualJuros = @percentualJuros,
                    percentualMulta = @percentualMulta,
                    percentualDesconto = @percentualDesconto,
                    valorTotal = @valorTotal,
                    dataEmissao = @dataEmissao,
                    dataVencimento = @dataVencimento,
                    dataPagamento = @dataPagamento,
                    codFormaPagamento = @codFormaPagamento,
                    situacao = @situacao,
                    observacoes = @observacoes
                WHERE notaNumero = @notaNumero
                  AND notaModelo = @notaModelo
                  AND notaSerie = @notaSerie
                  AND codForn = @codForn
                  AND numeroParcela = @numeroParcela",
                con);

            AddParams(cmd, body);

            var alteradas = await cmd.ExecuteNonQueryAsync();

            if (alteradas == 0)
                throw new InvalidOperationException("Nenhuma conta a pagar avulsa foi alterada.");

            await log.AddAsync(
                "ContasPagarAvulsa",
                "EDITOU",
                $"Editou Conta a Pagar Avulsa: Nº {body.NotaNumero}/{body.NotaSerie} " +
                $"(modelo {body.NotaModelo}) - Fornecedor {body.CodForn} - " +
                $"Parcela {body.NumeroParcela}/{body.TotalParcelas}.");
        }

        public async Task DeleteAsync(
            string notaNumero,
            string notaModelo,
            string notaSerie,
            int codForn,
            int numeroParcela)
        {
            var existente = await GetByIdAsync(
                notaNumero,
                notaModelo,
                notaSerie,
                codForn,
                numeroParcela);

            if (existente is null)
                throw new InvalidOperationException("Conta a pagar avulsa não encontrada.");

            if (string.Equals(existente.Situacao, "PAGA", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Uma conta paga não pode ser excluída.");

            if (existente.ValorPago > 0)
                throw new InvalidOperationException("Uma conta com pagamento registrado não pode ser excluída.");

            await using var con = Conn();
            await con.OpenAsync();

            await using var cmd = new MySqlCommand(@"
                DELETE FROM contasPagarAvulsa
                WHERE notaNumero = @notaNumero
                  AND notaModelo = @notaModelo
                  AND notaSerie = @notaSerie
                  AND codForn = @codForn
                  AND numeroParcela = @numeroParcela",
                con);

            AddChave(cmd, notaNumero, notaModelo, notaSerie, codForn, numeroParcela);

            var removidas = await cmd.ExecuteNonQueryAsync();

            if (removidas == 0)
                throw new InvalidOperationException("Nenhuma conta a pagar avulsa foi excluída.");

            await log.AddAsync(
                "ContasPagarAvulsa",
                "EXCLUIU",
                $"Excluiu Conta a Pagar Avulsa: Nº {notaNumero}/{notaSerie} " +
                $"(modelo {notaModelo}) - Fornecedor {codForn} - " +
                $"Parcela {numeroParcela}/{existente.TotalParcelas}.");
        }

        // ---------------------------------------------------------------
        // Pagamento e cancelamento
        // ---------------------------------------------------------------

        /// <summary>
        /// Registra o pagamento de uma parcela. Juros, multa e desconto são calculados aqui,
        /// a partir dos percentuais da condição de pagamento gravados na parcela:
        ///  - em atraso: multa uma vez + juros proporcionais aos dias (percentual ao mês);
        ///  - no prazo: desconto.
        /// </summary>
        public async Task<ContasPagarAvulsa> PagarAsync(
            string notaNumero,
            string notaModelo,
            string notaSerie,
            int codForn,
            int numeroParcela,
            DateTime dataPagamento,
            int? codFormaPagamento)
        {
            var conta = await GetByIdAsync(notaNumero, notaModelo, notaSerie, codForn, numeroParcela)
                ?? throw new InvalidOperationException("Conta a pagar avulsa não encontrada.");

            var situacao = (conta.Situacao ?? string.Empty).ToUpperInvariant();

            if (situacao == "PAGA")
                throw new InvalidOperationException("Esta parcela já foi paga.");

            if (situacao == "CANCELADA")
                throw new InvalidOperationException("Uma parcela cancelada não pode ser paga.");

            if (!codFormaPagamento.HasValue || codFormaPagamento.Value <= 0)
                throw new InvalidOperationException("Informe a forma de pagamento.");

            var pagamento = dataPagamento.Date;

            if (pagamento < conta.DataEmissao.Date)
                throw new InvalidOperationException("A data de pagamento não pode ser anterior à data de emissão.");

            if (pagamento > DateTime.Today)
                throw new InvalidOperationException("A data de pagamento não pode ser futura.");

            var diasAtraso = Math.Max((pagamento - conta.DataVencimento.Date).Days, 0);

            decimal desconto = 0, juros = 0, multa = 0;

            if (diasAtraso > 0)
            {
                multa = Math.Round(conta.ValorOriginal * conta.PercentualMulta / 100m, 2);
                juros = Math.Round(conta.ValorOriginal * conta.PercentualJuros / 100m * diasAtraso / 30m, 2);
            }
            else
            {
                desconto = Math.Round(conta.ValorOriginal * conta.PercentualDesconto / 100m, 2);
            }

            var valorFinal = Math.Round(conta.ValorOriginal - desconto + juros + multa, 2);

            if (valorFinal <= 0)
                throw new InvalidOperationException("O valor final do pagamento deve ser maior que zero.");

            await using var con = Conn();
            await con.OpenAsync();

            await using var cmd = new MySqlCommand(@"
                UPDATE contasPagarAvulsa
                SET valorPago = @valorPago,
                    valorDesconto = @valorDesconto,
                    valorJuros = @valorJuros,
                    valorMulta = @valorMulta,
                    valorTotal = @valorTotal,
                    dataPagamento = @dataPagamento,
                    codFormaPagamento = @codFormaPagamento,
                    situacao = 'PAGA'
                WHERE notaNumero = @notaNumero
                  AND notaModelo = @notaModelo
                  AND notaSerie = @notaSerie
                  AND codForn = @codForn
                  AND numeroParcela = @numeroParcela
                  AND situacao NOT IN ('PAGA', 'CANCELADA')",
                con);

            AddChave(cmd, notaNumero, notaModelo, notaSerie, codForn, numeroParcela);
            cmd.Parameters.AddWithValue("@valorPago", valorFinal);
            cmd.Parameters.AddWithValue("@valorDesconto", desconto);
            cmd.Parameters.AddWithValue("@valorJuros", juros);
            cmd.Parameters.AddWithValue("@valorMulta", multa);
            cmd.Parameters.AddWithValue("@valorTotal", valorFinal);
            cmd.Parameters.AddWithValue("@dataPagamento", pagamento);
            cmd.Parameters.AddWithValue("@codFormaPagamento", codFormaPagamento.Value);

            if (await cmd.ExecuteNonQueryAsync() == 0)
                throw new InvalidOperationException("Nenhuma parcela foi paga. Atualize a lista e tente novamente.");

            await log.AddAsync(
                "ContasPagarAvulsa",
                "PAGOU",
                $"Pagou Conta a Pagar Avulsa: Nº {notaNumero}/{notaSerie} (modelo {notaModelo}) - " +
                $"Fornecedor {codForn} - Parcela {numeroParcela}/{conta.TotalParcelas} - " +
                $"Valor pago {valorFinal:N2} (juros {juros:N2}, multa {multa:N2}, desconto {desconto:N2}).");

            return (await GetByIdAsync(notaNumero, notaModelo, notaSerie, codForn, numeroParcela))!;
        }

        /// <summary>
        /// Cancela a conta inteira (todas as parcelas da nota/fornecedor).
        /// Não permite cancelar se existir alguma parcela paga.
        /// </summary>
        public async Task CancelarAsync(
            string notaNumero,
            string notaModelo,
            string notaSerie,
            int codForn)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                int total, pagas, abertas;

                await using (var consulta = new MySqlCommand(@"
                    SELECT COUNT(*),
                           COALESCE(SUM(CASE WHEN situacao = 'PAGA' OR valorPago > 0 THEN 1 ELSE 0 END), 0),
                           COALESCE(SUM(CASE WHEN situacao <> 'CANCELADA' THEN 1 ELSE 0 END), 0)
                    FROM contasPagarAvulsa
                    WHERE notaNumero = @notaNumero
                      AND notaModelo = @notaModelo
                      AND notaSerie = @notaSerie
                      AND codForn = @codForn
                    FOR UPDATE",
                    con, tx))
                {
                    consulta.Parameters.AddWithValue("@notaNumero", notaNumero);
                    consulta.Parameters.AddWithValue("@notaModelo", notaModelo);
                    consulta.Parameters.AddWithValue("@notaSerie", notaSerie);
                    consulta.Parameters.AddWithValue("@codForn", codForn);

                    await using var rd = await consulta.ExecuteReaderAsync();
                    await rd.ReadAsync();
                    total = Convert.ToInt32(rd.GetValue(0));
                    pagas = Convert.ToInt32(rd.GetValue(1));
                    abertas = Convert.ToInt32(rd.GetValue(2));
                }

                if (total == 0)
                    throw new InvalidOperationException("Conta a pagar avulsa não encontrada.");

                if (pagas > 0)
                    throw new InvalidOperationException("Não é possível cancelar: existe parcela paga nesta conta.");

                if (abertas == 0)
                    throw new InvalidOperationException("Esta conta já está cancelada.");

                await using var cmd = new MySqlCommand(@"
                    UPDATE contasPagarAvulsa
                    SET situacao = 'CANCELADA'
                    WHERE notaNumero = @notaNumero
                      AND notaModelo = @notaModelo
                      AND notaSerie = @notaSerie
                      AND codForn = @codForn
                      AND situacao <> 'CANCELADA'",
                    con, tx);

                cmd.Parameters.AddWithValue("@notaNumero", notaNumero);
                cmd.Parameters.AddWithValue("@notaModelo", notaModelo);
                cmd.Parameters.AddWithValue("@notaSerie", notaSerie);
                cmd.Parameters.AddWithValue("@codForn", codForn);

                await cmd.ExecuteNonQueryAsync();
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync(
                "ContasPagarAvulsa",
                "CANCELOU",
                $"Cancelou Conta a Pagar Avulsa: Nº {notaNumero}/{notaSerie} " +
                $"(modelo {notaModelo}) - Fornecedor {codForn} (todas as parcelas).");
        }

        // ---------------------------------------------------------------
        // Regras compartilhadas
        // ---------------------------------------------------------------

        private static void Normalizar(ContasPagarAvulsa b)
        {
            b.NotaNumero = (b.NotaNumero ?? string.Empty).Trim();
            b.NotaModelo = (b.NotaModelo ?? string.Empty).Trim();
            b.NotaSerie = (b.NotaSerie ?? string.Empty).Trim();

            b.Situacao = string.IsNullOrWhiteSpace(b.Situacao)
                ? "PENDENTE"
                : b.Situacao.Trim().ToUpperInvariant();

            b.Observacoes = string.IsNullOrWhiteSpace(b.Observacoes)
                ? null
                : b.Observacoes.Trim();

            // O total é sempre calculado no servidor; o valor enviado pelo cliente é ignorado.
            b.ValorTotal = Math.Max(
                Math.Round(b.ValorOriginal + b.ValorJuros + b.ValorMulta - b.ValorDesconto, 2),
                0m);
        }

        private static void Validar(ContasPagarAvulsa b)
        {
            if (b.CodForn <= 0)
                throw new InvalidOperationException("Informe o fornecedor.");

            if (b.NotaNumero.Length == 0)
                throw new InvalidOperationException("Informe o número da nota.");

            if (b.NotaModelo.Length == 0)
                throw new InvalidOperationException("Informe o modelo da nota.");

            if (b.NotaSerie.Length == 0)
                throw new InvalidOperationException("Informe a série da nota.");

            if (b.NumeroParcela <= 0)
                throw new InvalidOperationException("O número da parcela deve ser maior que zero.");

            if (b.TotalParcelas <= 0)
                throw new InvalidOperationException("O total de parcelas deve ser maior que zero.");

            if (b.NumeroParcela > b.TotalParcelas)
                throw new InvalidOperationException("O número da parcela não pode ser maior que o total de parcelas.");

            if (b.ValorOriginal < 0 || b.ValorPago < 0 || b.ValorJuros < 0 || b.ValorMulta < 0 || b.ValorDesconto < 0 ||
                b.PercentualJuros < 0 || b.PercentualMulta < 0 || b.PercentualDesconto < 0)
                throw new InvalidOperationException("Valores e percentuais não podem ser negativos.");

            if (b.DataEmissao == default)
                throw new InvalidOperationException("Informe a data de emissão.");

            if (b.DataVencimento == default)
                throw new InvalidOperationException("Informe a data de vencimento.");

            if (b.DataVencimento.Date < b.DataEmissao.Date)
                throw new InvalidOperationException("A data de vencimento não pode ser anterior à data de emissão.");

            if (!SituacoesValidas.Contains(b.Situacao))
                throw new InvalidOperationException("Situação inválida.");

            if (b.ValorPago > b.ValorTotal)
                throw new InvalidOperationException("O valor pago não pode ser maior que o valor total.");

            if (b.Situacao == "PAGA")
            {
                if (b.ValorPago < b.ValorTotal)
                    throw new InvalidOperationException("Uma conta PAGA deve ter o valor pago igual ao valor total.");

                if (!b.DataPagamento.HasValue)
                    throw new InvalidOperationException("Informe a data de pagamento.");
            }

            if (b.Situacao == "PARCIAL" && (b.ValorPago <= 0 || b.ValorPago >= b.ValorTotal))
                throw new InvalidOperationException("Uma conta PARCIAL deve ter valor pago maior que zero e menor que o total.");

            if (b.DataPagamento.HasValue && b.DataPagamento.Value.Date < b.DataEmissao.Date)
                throw new InvalidOperationException("A data de pagamento não pode ser anterior à data de emissão.");
        }

        private static async Task InserirAsync(MySqlConnection con, MySqlTransaction tx, ContasPagarAvulsa body)
        {
            await using (var verifica = new MySqlCommand(@"
                SELECT COUNT(*)
                FROM contasPagarAvulsa
                WHERE notaNumero = @notaNumero
                  AND notaModelo = @notaModelo
                  AND notaSerie = @notaSerie
                  AND codForn = @codForn
                  AND numeroParcela = @numeroParcela",
                con, tx))
            {
                AddChave(verifica, body.NotaNumero, body.NotaModelo, body.NotaSerie, body.CodForn, body.NumeroParcela);

                if (Convert.ToInt32(await verifica.ExecuteScalarAsync()) > 0)
                    throw new InvalidOperationException(
                        $"A parcela {body.NumeroParcela} desta conta a pagar avulsa já está cadastrada.");
            }

            await using var cmd = new MySqlCommand(@"
                INSERT INTO contasPagarAvulsa (
                    notaNumero, notaModelo, notaSerie, codForn,
                    numeroParcela, totalParcelas,
                    valorOriginal, valorPago, valorDesconto, valorJuros, valorMulta,
                    percentualJuros, percentualMulta, percentualDesconto, valorTotal,
                    dataEmissao, dataVencimento, dataPagamento,
                    codFormaPagamento, codCondicao, situacao, observacoes
                )
                VALUES (
                    @notaNumero, @notaModelo, @notaSerie, @codForn,
                    @numeroParcela, @totalParcelas,
                    @valorOriginal, @valorPago, @valorDesconto, @valorJuros, @valorMulta,
                    @percentualJuros, @percentualMulta, @percentualDesconto, @valorTotal,
                    @dataEmissao, @dataVencimento, @dataPagamento,
                    @codFormaPagamento, @codCondicao, @situacao, @observacoes
                )",
                con, tx);

            AddParams(cmd, body);

            try
            {
                await cmd.ExecuteNonQueryAsync();
            }
            catch (MySqlException ex) when (ex.ErrorCode == MySqlErrorCode.DuplicateKeyEntry)
            {
                // Corrida entre duas requisições: o SELECT acima não enxerga a outra transação.
                throw new InvalidOperationException(
                    $"A parcela {body.NumeroParcela} desta conta a pagar avulsa já está cadastrada.");
            }
        }

        // ---------------------------------------------------------------
        // Parâmetros e mapeamento
        // ---------------------------------------------------------------

        private static void AddChave(
            MySqlCommand cmd,
            string notaNumero,
            string notaModelo,
            string notaSerie,
            int codForn,
            int numeroParcela)
        {
            cmd.Parameters.AddWithValue("@notaNumero", notaNumero);
            cmd.Parameters.AddWithValue("@notaModelo", notaModelo);
            cmd.Parameters.AddWithValue("@notaSerie", notaSerie);
            cmd.Parameters.AddWithValue("@codForn", codForn);
            cmd.Parameters.AddWithValue("@numeroParcela", numeroParcela);
        }

        private static void AddParams(MySqlCommand cmd, ContasPagarAvulsa body)
        {
            AddChave(cmd, body.NotaNumero, body.NotaModelo, body.NotaSerie, body.CodForn, body.NumeroParcela);

            cmd.Parameters.AddWithValue("@totalParcelas", body.TotalParcelas);
            cmd.Parameters.AddWithValue("@valorOriginal", body.ValorOriginal);
            cmd.Parameters.AddWithValue("@valorPago", body.ValorPago);
            cmd.Parameters.AddWithValue("@valorDesconto", body.ValorDesconto);
            cmd.Parameters.AddWithValue("@valorJuros", body.ValorJuros);
            cmd.Parameters.AddWithValue("@valorMulta", body.ValorMulta);
            cmd.Parameters.AddWithValue("@percentualJuros", body.PercentualJuros);
            cmd.Parameters.AddWithValue("@percentualMulta", body.PercentualMulta);
            cmd.Parameters.AddWithValue("@percentualDesconto", body.PercentualDesconto);
            cmd.Parameters.AddWithValue("@valorTotal", body.ValorTotal);
            cmd.Parameters.AddWithValue("@dataEmissao", body.DataEmissao.Date);
            cmd.Parameters.AddWithValue("@dataVencimento", body.DataVencimento.Date);
            cmd.Parameters.AddWithValue(
                "@dataPagamento",
                body.DataPagamento.HasValue ? body.DataPagamento.Value.Date : DBNull.Value);
            cmd.Parameters.AddWithValue(
                "@codFormaPagamento",
                body.CodFormaPagamento.HasValue ? body.CodFormaPagamento.Value : DBNull.Value);
            cmd.Parameters.AddWithValue(
                "@codCondicao",
                body.CodCondicao.HasValue ? body.CodCondicao.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@situacao", body.Situacao);
            cmd.Parameters.AddWithValue(
                "@observacoes",
                body.Observacoes is null ? DBNull.Value : body.Observacoes);
        }

        private static ContasPagarAvulsa Map(MySqlDataReader rd)
        {
            return new ContasPagarAvulsa
            {
                NotaNumero = rd.IsDBNull(rd.GetOrdinal("notaNumero")) ? string.Empty : rd.GetString("notaNumero"),
                NotaModelo = rd.IsDBNull(rd.GetOrdinal("notaModelo")) ? string.Empty : rd.GetString("notaModelo"),
                NotaSerie = rd.IsDBNull(rd.GetOrdinal("notaSerie")) ? string.Empty : rd.GetString("notaSerie"),

                CodForn = rd.GetInt32(rd.GetOrdinal("codForn")),
                NumeroParcela = rd.GetInt32(rd.GetOrdinal("numeroParcela")),
                TotalParcelas = rd.GetInt32(rd.GetOrdinal("totalParcelas")),
                ValorOriginal = rd.GetDecimal(rd.GetOrdinal("valorOriginal")),
                ValorPago = rd.GetDecimal(rd.GetOrdinal("valorPago")),
                ValorDesconto = rd.GetDecimal(rd.GetOrdinal("valorDesconto")),
                ValorJuros = rd.GetDecimal(rd.GetOrdinal("valorJuros")),
                ValorMulta = rd.GetDecimal(rd.GetOrdinal("valorMulta")),
                PercentualJuros = rd.GetDecimal(rd.GetOrdinal("percentualJuros")),
                PercentualMulta = rd.GetDecimal(rd.GetOrdinal("percentualMulta")),
                PercentualDesconto = rd.GetDecimal(rd.GetOrdinal("percentualDesconto")),
                ValorTotal = rd.GetDecimal(rd.GetOrdinal("valorTotal")),
                DataEmissao = rd.GetDateTime(rd.GetOrdinal("dataEmissao")),
                DataVencimento = rd.GetDateTime(rd.GetOrdinal("dataVencimento")),

                DataPagamento = rd.IsDBNull(rd.GetOrdinal("dataPagamento"))
                    ? null
                    : rd.GetDateTime(rd.GetOrdinal("dataPagamento")),

                CodFormaPagamento = rd.IsDBNull(rd.GetOrdinal("codFormaPagamento"))
                    ? null
                    : rd.GetInt32(rd.GetOrdinal("codFormaPagamento")),

                CodCondicao = rd.IsDBNull(rd.GetOrdinal("codCondicao"))
                    ? null
                    : rd.GetInt32(rd.GetOrdinal("codCondicao")),

                Situacao = rd.GetString(rd.GetOrdinal("situacao")),

                Observacoes = rd.IsDBNull(rd.GetOrdinal("observacoes"))
                    ? null
                    : rd.GetString(rd.GetOrdinal("observacoes"))
            };
        }
    }
}