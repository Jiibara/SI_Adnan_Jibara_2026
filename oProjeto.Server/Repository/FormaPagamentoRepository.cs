using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class FormaPagamentoRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<FormaPagamentos>> GetAllAsync()
        {
            var list = new List<FormaPagamentos>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT * FROM FormaPagamentos ORDER BY CodFormaPagamento ASC;", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<FormaPagamentos?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT * FROM FormaPagamentos WHERE CodFormaPagamento = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? Map(rd) : null;
        }

        public async Task<FormaPagamentos> CreateAsync(FormaPagamentos body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO FormaPagamentos (FormaPagamento, Ativo)
                VALUES (@formaPagamentos, @ativo);
                SELECT LAST_INSERT_ID();", con);
            cmd.Parameters.AddWithValue("@formaPagamentos", body.FormaPagamento);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            body.CodFormaPagamento = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("FormaPagamentos", "CRIOU", $"Criou Forma de Pagamento: {body.FormaPagamento}");
            return body;
        }

        public async Task UpdateAsync(FormaPagamentos body)
        {
            var antes = await GetByIdAsync(body.CodFormaPagamento);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"UPDATE FormaPagamentos
                                                     SET FormaPagamento = @formaPagamento, Ativo = @ativo
                                                     WHERE CodFormaPagamento = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodFormaPagamento);
            cmd.Parameters.AddWithValue("@formaPagamento", body.FormaPagamento);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            await cmd.ExecuteNonQueryAsync();

            var mudancas = new List<string>();

            if (antes?.FormaPagamento != body.FormaPagamento)
                mudancas.Add($"Forma de Pagamento: {body.FormaPagamento} (Era {antes?.FormaPagamento})");
            if (antes?.Ativo != body.Ativo)
                mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Forma de Pagamento: {body.FormaPagamento}"
                : $"Editou Forma de Pagamento: {body.FormaPagamento}. {diff}";

            await log.AddAsync("FormaPagamentos", "EDITOU", desc);
        }

        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT FormaPagamento FROM FormaPagamentoss WHERE CodFormaPagamento = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM FormaPagamentos WHERE CodFormaPagamento = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("FormaPagamentos", "EXCLUIU", $"Excluiu Forma de Pagamentos: {nome}");
        }

        static FormaPagamentos Map(MySqlDataReader rd) => new()
        {
            CodFormaPagamento = rd.GetInt32("CodFormaPagamento"),
            FormaPagamento = rd.GetString("FormaPagamento"),
            Ativo = rd.GetBoolean("Ativo"),
        };
    }
}
