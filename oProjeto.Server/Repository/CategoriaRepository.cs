using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class CategoriaRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Categorias>> GetAllAsync()
        {
            var list = new List<Categorias>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT * FROM Categorias ORDER BY Categoria ASC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(MapCategoria(rd));
            return list;
        }
        public async Task<Categorias?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT * FROM Categorias WHERE CodCategoria = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? MapCategoria(rd) : null;
        }
        public async Task<Categorias> CreateAsync(Categorias body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO Categorias (Categoria, Ativo)
                VALUES (@categoria, @ativo);
                SELECT LAST_INSERT_ID();", con);
            cmd.Parameters.AddWithValue("@categoria", body.Categoria);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            body.CodCategoria = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Categorias", "CRIOU", $"Criou Categoria: {body.Categoria}");
            return body;
        }
        public async Task UpdateAsync(Categorias body)
        {
            var antes = await GetByIdAsync(body.CodCategoria);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                UPDATE Categorias SET Categoria = @categoria, Ativo = @ativo
                WHERE CodCategoria = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodCategoria);
            cmd.Parameters.AddWithValue("@categoria", body.Categoria);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            await cmd.ExecuteNonQueryAsync();

            var mudancas = new List<string>();
            if (antes?.Categoria != body.Categoria) 
                mudancas.Add($"Categoria: {body.Categoria} (Era {antes?.Categoria})");
            if (antes?.Ativo != body.Ativo)
                mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Categoria: {body.Categoria}"
                : $"Editou Categoria: {body.Categoria}. {diff}";

            await log.AddAsync("Categorias", "EDITOU", desc);
        }
        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT Categoria FROM Categorias WHERE CodCategoria = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Categorias WHERE CodCategoria = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Categorias", "EXCLUIU", $"Excluiu Categoria: {nome}");
        }

        static Categorias MapCategoria(MySqlDataReader rd) => new()
        {
            CodCategoria = rd.GetInt32("CodCategoria"),
            Categoria = rd.IsDBNull(rd.GetOrdinal("Categoria")) ? null : rd.GetString("Categoria"),
            Ativo = rd.GetBoolean("Ativo"),
        };
    }
}
