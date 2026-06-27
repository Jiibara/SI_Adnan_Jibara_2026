using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class PaisRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Paises>> GetAllAsync()
        {
            var list = new List<Paises>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT * FROM Paises ORDER BY CodPais ASC;", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<Paises?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT * FROM Paises WHERE CodPais = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? Map(rd) : null;
        }

        public async Task<Paises> CreateAsync(Paises body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO Paises (Pais, Sigla, Ddi, Moeda, Ativo)
                VALUES (@pais, @sigla, @ddi, @moeda, @ativo);
                SELECT LAST_INSERT_ID();", con);
            cmd.Parameters.AddWithValue("@pais", body.Pais);
            cmd.Parameters.AddWithValue("@sigla", body.Sigla);
            cmd.Parameters.AddWithValue("@ddi", body.DDI);
            cmd.Parameters.AddWithValue("@moeda", body.Moeda);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            body.CodPais = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Países", "CRIOU", $"Criou País: {body.Pais}");
            return body;
        }

        public async Task UpdateAsync(Paises body)
        {
            var antes = await GetByIdAsync(body.CodPais);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@" UPDATE Paises 
                                                      SET Pais = @pais, Sigla = @sigla, Ddi = @ddi, Moeda = @moeda, Ativo = @ativo 
                                                      WHERE CodPais = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodPais);
            cmd.Parameters.AddWithValue("@pais", body.Pais);
            cmd.Parameters.AddWithValue("@sigla", body.Sigla);
            cmd.Parameters.AddWithValue("@ddi", body.DDI);
            cmd.Parameters.AddWithValue("@moeda", body.Moeda);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            await cmd.ExecuteNonQueryAsync();

            var changes = new List<string>();
            if (antes?.Pais != body.Pais) 
                changes.Add($"País: {body.Pais} (Era {antes?.Pais})");
            if (antes?.Sigla != body.Sigla) 
                changes.Add($"Sigla: {body.Sigla} (Era {antes?.Sigla})");
            if (antes?.DDI != body.DDI) 
                changes.Add($"DDI: {body.DDI} (Era {antes?.DDI})");
            if (antes?.Moeda != body.Moeda) 
                changes.Add($"Moeda: {body.Moeda} (Era {antes?.Moeda})");
            if (antes?.Ativo != body.Ativo) 
                changes.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = changes.Count > 0 ? string.Join(". ", changes) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou País: {body.Pais}"
                : $"Editou País: {body.Pais}. {diff}";

            await log.AddAsync("Países", "EDITOU", desc);
        }

        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT Pais FROM Paises WHERE CodPais = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Paises WHERE CodPais = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Países", "EXCLUIU", $"Excluiu País: {nome}");
        }

        static Paises Map(MySqlDataReader rd) => new()
        {
            CodPais = rd.GetInt32("CodPais"),
            Pais = rd.GetString("Pais"),
            Sigla = rd.IsDBNull(rd.GetOrdinal("Sigla")) ? null : rd.GetString("Sigla"),
            DDI = rd.IsDBNull(rd.GetOrdinal("Ddi")) ? null : rd.GetString("Ddi"),
            Moeda = rd.IsDBNull(rd.GetOrdinal("Moeda")) ? null : rd.GetString("Moeda"),
            Ativo = rd.GetBoolean("Ativo"),
        };
    }
}