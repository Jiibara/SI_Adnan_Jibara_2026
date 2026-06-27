using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class CidadeRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Cidades>> GetAllAsync()
        {
            var list = new List<Cidades>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT c.*, e.CodEstado, e.UF, e.Estado, e.CodPais, e.Ativo AS EstadoAtivo
                FROM Cidades c
                LEFT JOIN Estados e ON e.CodEstado = c.CodEstado
                ORDER BY c.CodCidade ASC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }
        public async Task<Cidades?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT c.*, e.CodEstado, e.UF, e.Estado, e.CodPais, e.Ativo AS EstadoAtivo
                FROM Cidades c
                LEFT JOIN Estados e ON e.CodEstado = c.CodEstado
                WHERE c.CodCidade = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? Map(rd) : null;
        }
        public async Task<Cidades> CreateAsync(Cidades body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO Cidades (Cidade, DDD, CodEstado, Ativo)
                VALUES (@cidade, @ddd @codEstado, @ativo);
                SELECT LAST_INSERT_ID();", con);
            cmd.Parameters.AddWithValue("@cidade", body.Cidade);
            cmd.Parameters.AddWithValue("@ddd", body.DDD);
            cmd.Parameters.AddWithValue("@codEstado", body.CodEstado);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            body.CodCidade = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Cidades", "CRIOU", $"Criou Cidade: {body.Cidade}");
            return body;
        }
        public async Task UpdateAsync(Cidades body)
        {

            var antes = await GetByIdAsync(body.CodCidade);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                UPDATE Cidades
                SET Cidade = @cidade, DDD = @ddd, CodEstado = @codEstado, Ativo = @ativo
                WHERE CodCidade = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodCidade);
            cmd.Parameters.AddWithValue("@cidade", body.Cidade);
            cmd.Parameters.AddWithValue("@ddd", body.DDD);
            cmd.Parameters.AddWithValue("@codEstado", body.CodEstado);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            await cmd.ExecuteNonQueryAsync();

            var mudancas = new List<string>();

            if (antes?.Cidade != body.Cidade)
                mudancas.Add($"Cidade: '{body.Cidade} (Era {antes?.Cidade})'");
            if (antes?.DDD != body.DDD)
                mudancas.Add($"DDD: '{body.DDD} (Era {antes?.DDD})'");

            if (antes?.CodEstado != body.CodEstado)
            {
                var nomeEstadoNovo = await GetNomeEstadoAsync(con, body.CodEstado);
                mudancas.Add($"Estado: {nomeEstadoNovo} (Era {antes?.Estado?.Estado})");
            }

            if (antes?.Ativo != body.Ativo)
                mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Cidade: {body.Cidade}"
                : $"Editou Cidade: {body.Cidade}. {diff}";

            await log.AddAsync("Cidades", "EDITOU", desc);
        }
        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT Cidade FROM Cidades WHERE CodCidade = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Cidades WHERE CodCidade = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Cidades", "EXCLUIU", $"Excluiu Cidade: {nome}");
        }
        private static async Task<string> GetNomeEstadoAsync(MySqlConnection con, int codEstado)
        {
            await using var cmd = new MySqlCommand("SELECT Estado FROM Estados WHERE CodEstado = @id", con);
            cmd.Parameters.AddWithValue("@id", codEstado);
            return (await cmd.ExecuteScalarAsync())?.ToString() ?? codEstado.ToString();
        }
        static Cidades Map(MySqlDataReader rd) => new()
        {
            CodCidade = rd.GetInt32("CodCidade"),
            Cidade = rd.IsDBNull(rd.GetOrdinal("Cidade")) ? null : rd.GetString("Cidade"),
            DDD = rd.IsDBNull(rd.GetOrdinal("DDD")) ? null : rd.GetString("DDD"),
            CodEstado = rd.GetInt32("CodEstado"),
            Ativo = rd.GetBoolean("Ativo"),
            Estado = new Estados
            {
                CodEstado = rd.GetInt32("CodEstado"),
                UF = rd.IsDBNull(rd.GetOrdinal("UF")) ? null : rd.GetString("UF"),
                Estado = rd.IsDBNull(rd.GetOrdinal("Estado")) ? null : rd.GetString("Estado"),
                CodPais = rd.GetInt32("CodPais"),
                Ativo = rd.GetBoolean("EstadoAtivo"),
            }
        };
    }
}