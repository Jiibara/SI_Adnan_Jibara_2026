using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class ServicoRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Servicos>> GetAllAsync()
        {
            var list = new List<Servicos>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT * FROM Servicos ORDER BY CodServico ASC;", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<Servicos?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT * FROM Servicos WHERE CodServico = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? Map(rd) : null;
        }

        public async Task<Servicos> CreateAsync(Servicos body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO Servicos (Servico, Preco, DuracaoMinutos, Ativo)
                VALUES (@servico, @preco, @duracao, @ativo);
                SELECT LAST_INSERT_ID();", con);
            cmd.Parameters.AddWithValue("@servico", body.Servico);
            cmd.Parameters.AddWithValue("@preco", body.Preco);
            cmd.Parameters.AddWithValue("@duracao", body.DuracaoMinutos);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            body.CodServico = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Serviços", "CRIOU", $"Criou Serviço: {body.Servico}");
            return body;
        }

        public async Task UpdateAsync(Servicos body)
        {
            var antes = await GetByIdAsync(body.CodServico);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@" UPDATE Servicos 
                                                      SET Servico = @servico, Preco = @preco, DuracaoMinutos = @duracao, Ativo = @ativo 
                                                      WHERE CodServico = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodServico);
            cmd.Parameters.AddWithValue("@servico", body.Servico);
            cmd.Parameters.AddWithValue("@preco", body.Preco);
            cmd.Parameters.AddWithValue("@duracao", body.DuracaoMinutos);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            await cmd.ExecuteNonQueryAsync();

            var changes = new List<string>();
            if (antes?.Servico != body.Servico)
                changes.Add($"Serviço: {body.Servico} (Era {antes?.Servico})");
            if (antes?.Preco != body.Preco)
                changes.Add($"Preço: {body.Preco:N2} (Era {antes?.Preco:N2})");
            if (antes?.DuracaoMinutos != body.DuracaoMinutos)
                changes.Add($"Duração: {body.DuracaoMinutos} min (Era {antes?.DuracaoMinutos} min)");
            if (antes?.Ativo != body.Ativo)
                changes.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = changes.Count > 0 ? string.Join(". ", changes) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Serviço: {body.Servico}"
                : $"Editou Serviço: {body.Servico}. {diff}";

            await log.AddAsync("Serviços", "EDITOU", desc);
        }

        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT Servico FROM Servicos WHERE CodServico = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Servicos WHERE CodServico = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Serviços", "EXCLUIU", $"Excluiu Serviço: {nome}");
        }

        static Servicos Map(MySqlDataReader rd) => new()
        {
            CodServico = rd.GetInt32("CodServico"),
            Servico = rd.GetString("Servico"),
            Preco = rd.GetDecimal("Preco"),
            DuracaoMinutos = rd.GetInt32("DuracaoMinutos"),
            Ativo = rd.GetBoolean("Ativo"),
        };
    }
}