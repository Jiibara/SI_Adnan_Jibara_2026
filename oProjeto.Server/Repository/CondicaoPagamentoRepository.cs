using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class CondicaoPagamentoRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<CondicaoPagamentos>> GetAllAsync()
        {
            var list = new List<CondicaoPagamentos>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
            SELECT * FROM CondicaoPagamentos
            ORDER BY CodCondicao ASC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            await rd.CloseAsync();

            foreach (var c in list)
                c.Parcelas = (await GetParcelasAsync(con, c.CodCondicao)).ToList();

            return list;
        }

        public async Task<CondicaoPagamentos?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
            SELECT * FROM CondicaoPagamentos
            WHERE CodCondicao = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            if (!await rd.ReadAsync()) return null;
            var c = Map(rd);
            await rd.CloseAsync();
            c.Parcelas = (await GetParcelasAsync(con, c.CodCondicao)).ToList();
            return c;
        }

        public async Task<CondicaoPagamentos> CreateAsync(CondicaoPagamentos body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();
            try
            {
                await using var cmd = new MySqlCommand(@"
                INSERT INTO CondicaoPagamentos
                    (CondicaoPagamento, NumeroParcelas, PercentualJuros, PercentualMultas, PercentualDesconto, Ativo)
                VALUES
                    (@condicao, @numParcelas, @juros, @multas, @desconto, @ativo);
                SELECT LAST_INSERT_ID();", con, tx);
                Params(cmd, body);
                body.CodCondicao = Convert.ToInt32(await cmd.ExecuteScalarAsync());

                await SaveParcelasAsync(con, tx, body.CodCondicao, body.Parcelas);

                await tx.CommitAsync();
                await log.AddAsync("CondicaoPagamentos", "CRIOU", $"Criou Condição: {body.CondicaoPagamento}");
                return body;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task UpdateAsync(CondicaoPagamentos body)
        {
            var antes = await GetByIdAsync(body.CodCondicao);

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();
            try
            {
                await using var cmd = new MySqlCommand(@"
                UPDATE CondicaoPagamentos SET
                    CondicaoPagamento  = @condicao,
                    NumeroParcelas     = @numParcelas,
                    PercentualJuros    = @juros,
                    PercentualMultas   = @multas,
                    PercentualDesconto = @desconto,
                    Ativo              = @ativo
                WHERE CodCondicao = @id", con, tx);
                cmd.Parameters.AddWithValue("@id", body.CodCondicao);
                Params(cmd, body);
                await cmd.ExecuteNonQueryAsync();

                // deleta e recria as parcelas (chave composta, sem auto_increment)
                await using var del = new MySqlCommand(
                    "DELETE FROM Parcelas WHERE CodCondicao = @id", con, tx);
                del.Parameters.AddWithValue("@id", body.CodCondicao);
                await del.ExecuteNonQueryAsync();

                await SaveParcelasAsync(con, tx, body.CodCondicao, body.Parcelas);
                await tx.CommitAsync();

                var mudancas = new List<string>();

                if (antes?.CondicaoPagamento != body.CondicaoPagamento)
                    mudancas.Add($"Condição: {body.CondicaoPagamento} (Era {antes?.CondicaoPagamento})");
                if (antes?.PercentualDesconto != body.PercentualDesconto)
                    mudancas.Add($"Desconto: {body.PercentualDesconto}% (Era {antes?.PercentualDesconto}%)");
                if (antes?.PercentualMultas != body.PercentualMultas)
                    mudancas.Add($"Multa: {body.PercentualMultas}% (Era {antes?.PercentualMultas}%)");
                if (antes?.PercentualJuros != body.PercentualJuros)
                    mudancas.Add($"Juros: {body.PercentualJuros}% (Era {antes?.PercentualJuros}%)");
                if (antes?.NumeroParcelas != body.Parcelas?.Count)
                    mudancas.Add($"Parcelas: {body.Parcelas?.Count} (Era {antes?.NumeroParcelas})");
                if (antes?.Ativo != body.Ativo)
                    mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

                var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
                var desc = string.IsNullOrEmpty(diff)
                    ? $"Editou Condição: {body.CondicaoPagamento}"
                    : $"Editou Condição: {body.CondicaoPagamento}. {diff}";

                await log.AddAsync("CondicaoPagamentos", "EDITOU", desc);
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand(
                "SELECT CondicaoPagamento FROM CondicaoPagamentos WHERE CodCondicao = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var tx = await con.BeginTransactionAsync();
            try
            {
                // deleta parcelas primeiro (FK)
                await using var delParcelas = new MySqlCommand(
                    "DELETE FROM Parcelas WHERE CodCondicao = @id", con, tx);
                delParcelas.Parameters.AddWithValue("@id", id);
                await delParcelas.ExecuteNonQueryAsync();

                await using var cmd = new MySqlCommand(
                    "DELETE FROM CondicaoPagamentos WHERE CodCondicao = @id", con, tx);
                cmd.Parameters.AddWithValue("@id", id);
                await cmd.ExecuteNonQueryAsync();

                await tx.CommitAsync();
                await log.AddAsync("CondicaoPagamentos", "EXCLUIU", $"Excluiu Condição: {nome}");
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        //   Parcelas 
        private static async Task SaveParcelasAsync(
            MySqlConnection con, MySqlTransaction tx,
            int codCondicao, ICollection<Parcelas>? parcelas)
        {
            if (parcelas == null || parcelas.Count == 0) return;

            foreach (var p in parcelas)
            {
                await using var cmd = new MySqlCommand(@"
                INSERT INTO Parcelas (CodCondicao, NumeroParcela, Percentual, Dias, CodFormaPagamento)
                VALUES (@codCond, @num, @perc, @dias, @codFP)", con, tx);
                cmd.Parameters.AddWithValue("@codCond", codCondicao);
                cmd.Parameters.AddWithValue("@num", p.NumeroParcela);
                cmd.Parameters.AddWithValue("@perc", p.Percentual);
                cmd.Parameters.AddWithValue("@dias", p.Dias);
                cmd.Parameters.AddWithValue("@codFP", p.CodFormaPagamento);
                await cmd.ExecuteNonQueryAsync();
                p.CodCondicao = codCondicao;
            }
        }

        private static async Task<IEnumerable<Parcelas>> GetParcelasAsync(
            MySqlConnection con, int codCondicao)
        {
            var list = new List<Parcelas>();
            await using var cmd = new MySqlCommand(@"
            SELECT p.*, f.FormaPagamento, f.Ativo AS FpAtivo
            FROM Parcelas p
            LEFT JOIN FormaPagamentos f ON f.CodFormaPagamento = p.CodFormaPagamento
            WHERE p.CodCondicao = @id
            ORDER BY p.NumeroParcela ASC", con);
            cmd.Parameters.AddWithValue("@id", codCondicao);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(MapParcela(rd));
            return list;
        }

        static void Params(MySqlCommand cmd, CondicaoPagamentos b)
        {
            cmd.Parameters.AddWithValue("@condicao", b.CondicaoPagamento);
            cmd.Parameters.AddWithValue("@numParcelas", b.Parcelas?.Count ?? 0);
            cmd.Parameters.AddWithValue("@juros", b.PercentualJuros ?? 0);
            cmd.Parameters.AddWithValue("@multas", b.PercentualMultas ?? 0);
            cmd.Parameters.AddWithValue("@desconto", b.PercentualDesconto ?? 0);
            cmd.Parameters.AddWithValue("@ativo", b.Ativo);
        }

        static CondicaoPagamentos Map(MySqlDataReader rd) => new()
        {
            CodCondicao = rd.GetInt32("CodCondicao"),
            CondicaoPagamento = rd.IsDBNull(rd.GetOrdinal("CondicaoPagamento")) ? null : rd.GetString("CondicaoPagamento"),
            NumeroParcelas = rd.IsDBNull(rd.GetOrdinal("NumeroParcelas")) ? null : rd.GetInt32("NumeroParcelas"),
            PercentualJuros = rd.IsDBNull(rd.GetOrdinal("PercentualJuros")) ? null : rd.GetDecimal("PercentualJuros"),
            PercentualMultas = rd.IsDBNull(rd.GetOrdinal("PercentualMultas")) ? null : rd.GetDecimal("PercentualMultas"),
            PercentualDesconto = rd.IsDBNull(rd.GetOrdinal("PercentualDesconto")) ? null : rd.GetDecimal("PercentualDesconto"),
            Ativo = rd.GetBoolean("Ativo"),
        };

        static Parcelas MapParcela(MySqlDataReader rd) => new()
        {
            CodCondicao = rd.GetInt32("CodCondicao"),
            NumeroParcela = rd.GetInt32("NumeroParcela"),
            Percentual = rd.GetDecimal("Percentual"),
            Dias = rd.GetInt32("Dias"),
            CodFormaPagamento = rd.GetInt32("CodFormaPagamento"),
            FormaPagamento = rd.IsDBNull(rd.GetOrdinal("FormaPagamento")) ? null : new FormaPagamentos
            {
                CodFormaPagamento = rd.GetInt32("CodFormaPagamento"),
                FormaPagamento = rd.GetString("FormaPagamento"),
                Ativo = rd.GetBoolean("FpAtivo"),
            }
        };
    }
}