using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class EstadoRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Estados>> GetAllAsync()
        {
            var list = new List<Estados>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT e.*, p.CodPais, p.Pais, p.Sigla, p.Ddi, p.Moeda, p.Ativo AS PaisAtivo
                FROM Estados e
                LEFT JOIN Paises p ON p.CodPais = e.CodPais
                ORDER BY e.CodEstado ASC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<Estados?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT e.*, p.CodPais, p.Pais, p.Sigla, p.Ddi, p.Moeda, p.Ativo AS PaisAtivo
                FROM Estados e
                LEFT JOIN Paises p ON p.CodPais = e.CodPais
                WHERE e.CodEstado = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? Map(rd) : null;
        }

        public async Task<Estados> CreateAsync(Estados body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO Estados (UF, Estado, CodPais, Ativo)
                VALUES (@uf, @estado, @codPais, @ativo);
                SELECT LAST_INSERT_ID();", con);
            cmd.Parameters.AddWithValue("@uf", body.UF);
            cmd.Parameters.AddWithValue("@estado", body.Estado);
            cmd.Parameters.AddWithValue("@codPais", body.CodPais);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            body.CodEstado = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Estados", "CRIOU", $"Criou Estado: {body.Estado} ({body.UF})");
            return body;
        }

        public async Task UpdateAsync(Estados body)
        {
            var antes = await GetByIdAsync(body.CodEstado);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                UPDATE Estados
                SET UF = @uf, Estado = @estado, CodPais = @codPais, Ativo = @ativo
                WHERE CodEstado = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodEstado);
            cmd.Parameters.AddWithValue("@uf", body.UF);
            cmd.Parameters.AddWithValue("@estado", body.Estado);
            cmd.Parameters.AddWithValue("@codPais", body.CodPais);
            cmd.Parameters.AddWithValue("@ativo", body.Ativo);
            await cmd.ExecuteNonQueryAsync();

            var mudancas = new List<string>();

            if (antes?.UF != body.UF)
                mudancas.Add($"UF: {body.UF} (Era {antes?.UF})");

            if (antes?.Estado != body.Estado)
                mudancas.Add($"Estado: {body.Estado} (Era {antes?.Estado})");

            if (antes?.CodPais != body.CodPais)
            {
                var nomePaisNovo = await GetNomePaisAsync(con, body.CodPais);
                mudancas.Add($"País: {nomePaisNovo} (Era {antes?.Pais?.Pais})");
            }

            if (antes?.Ativo != body.Ativo)
                mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Estado: {body.Estado} ({body.UF})"
                : $"Editou Estado: {body.Estado} ({body.UF}). {diff}";

            await log.AddAsync("Estados", "EDITOU", desc);
        }

        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT CONCAT(Estado, ' (', UF, ')') FROM Estados WHERE CodEstado = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Estados WHERE CodEstado = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Estados", "EXCLUIU", $"Excluiu Estado: {nome}");
        }

        private static async Task<string> GetNomePaisAsync(MySqlConnection con, int codPais)
        {
            await using var cmd = new MySqlCommand("SELECT Pais FROM Paises WHERE CodPais = @id", con);
            cmd.Parameters.AddWithValue("@id", codPais);
            return (await cmd.ExecuteScalarAsync())?.ToString() ?? codPais.ToString();
        }

        static Estados Map(MySqlDataReader rd) => new()
        {
            CodEstado = rd.GetInt32("CodEstado"),
            UF = rd.IsDBNull(rd.GetOrdinal("UF")) ? null : rd.GetString("UF"),
            Estado = rd.IsDBNull(rd.GetOrdinal("Estado")) ? null : rd.GetString("Estado"),
            CodPais = rd.GetInt32("CodPais"),
            Ativo = rd.GetBoolean("Ativo"),
            Pais = new Paises
            {
                CodPais = rd.GetInt32("CodPais"),
                Pais = rd.IsDBNull(rd.GetOrdinal("Pais")) ? null : rd.GetString("Pais"),
                Sigla = rd.IsDBNull(rd.GetOrdinal("Sigla")) ? null : rd.GetString("Sigla"),
                DDI = rd.IsDBNull(rd.GetOrdinal("Ddi")) ? null : rd.GetString("Ddi"),
                Moeda = rd.IsDBNull(rd.GetOrdinal("Moeda")) ? null : rd.GetString("Moeda"),
                Ativo = rd.GetBoolean("PaisAtivo"),
            }
        };
    }
}