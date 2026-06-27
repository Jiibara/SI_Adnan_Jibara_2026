using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class MarcaRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Marcas>> GetAllAsync()
        {
            var list = new List<Marcas>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT * FROM Marcas ORDER BY Marca ASC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(MapMarca(rd));
            return list;
        }
        public async Task<Marcas?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT * FROM Marcas WHERE codMarca = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? MapMarca(rd) : null;
        }
        public async Task<Marcas> CreateAsync(Marcas body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO Marcas (Marca, Ativo)
                VALUES (@marca, @ativo);
                SELECT LAST_INSERT_ID();", con);
            cmd.Parameters.AddWithValue("@marca", body.Marca);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            body.CodMarca = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Marcas", "CRIOU", $"Criou Marca: {body.Marca}");
            return body;
        }
        public async Task UpdateAsync(Marcas body)
        {
            var antes = await GetByIdAsync(body.CodMarca);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                UPDATE Marcas SET Marca = @marca, Ativo = @ativo
                WHERE codMarca = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodMarca);
            cmd.Parameters.AddWithValue("@marca", body.Marca);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            await cmd.ExecuteNonQueryAsync();

            var mudancas = new List<string>();
            if (antes?.Marca != body.Marca) 
                mudancas.Add($"Marca: {body.Marca} (Era {antes?.Marca})");
            if (antes?.Ativo != body.Ativo) 
                mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Marca: {body.Marca}"
                : $"Editou Marca: {body.Marca}. {diff}";

            await log.AddAsync("Marcas", "EDITOU", desc);
        }
        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT Marca FROM Marcas WHERE codMarca = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Marcas WHERE codMarca = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Marcas", "EXCLUIU", $"Excluiu Marca: {nome}");
        }
        static Marcas MapMarca(MySqlDataReader rd) => new()
        {
            CodMarca = rd.GetInt32("codMarca"),
            Marca = rd.IsDBNull(rd.GetOrdinal("Marca")) ? null : rd.GetString("Marca"),
            Ativo = rd.GetBoolean("Ativo"),
        };
    }
}