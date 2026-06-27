using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class VeiculoRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Veiculos>> GetAllAsync()
        {
            var list = new List<Veiculos>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT v.*, e.UF, e.Estado, e.CodPais, e.Ativo AS EstadoAtivo,
                       m.Marca, m.Ativo AS MarcaAtivo
                FROM Veiculos v
                LEFT JOIN Estados e ON e.CodEstado = v.CodEstado
                LEFT JOIN Marcas  m ON m.codMarca  = v.CodMarca
                ORDER BY v.CodVeic ASC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }
        public async Task<Veiculos?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT v.*, e.UF, e.Estado, e.CodPais, e.Ativo AS EstadoAtivo,
                       m.Marca, m.Ativo AS MarcaAtivo
                FROM Veiculos v
                LEFT JOIN Estados e ON e.CodEstado = v.CodEstado
                LEFT JOIN Marcas  m ON m.codMarca  = v.CodMarca
                WHERE v.CodVeic = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? Map(rd) : null;
        }
        public async Task<Veiculos> CreateAsync(Veiculos body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO Veiculos (PlacaVeic, PlacaMercoSul, CodEstado, CodANTT, Modelo, CodMarca, Ativo)
                VALUES (@placaVeic, @placaMercoSul, @codEstado, @codANTT, @modelo, @codMarca, @ativo);
                SELECT LAST_INSERT_ID();", con);
            Params(cmd, body);
            body.CodVeic = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Veículos", "CRIOU", $"Criou Veículo: {body.PlacaVeic}");
            return body;
        }
        public async Task UpdateAsync(Veiculos body)
        {
            var antes = await GetByIdAsync(body.CodVeic);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                UPDATE Veiculos SET
                    PlacaVeic     = @placaVeic,
                    PlacaMercoSul = @placaMercoSul,
                    CodEstado     = @codEstado,
                    CodANTT       = @codANTT,
                    Modelo        = @modelo,
                    CodMarca      = @codMarca,
                    Ativo         = @ativo
                WHERE CodVeic = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodVeic);
            Params(cmd, body);
            await cmd.ExecuteNonQueryAsync();

            var mudancas = new List<string>();

            if (antes?.PlacaVeic != body.PlacaVeic)
                mudancas.Add($"Placa: {body.PlacaVeic} (Era {antes?.PlacaVeic})");
            if (antes?.PlacaMercoSul != body.PlacaMercoSul) mudancas.Add($"Placa Mercosul: {body.PlacaMercoSul} (Era {antes?.PlacaMercoSul})");
            if (antes?.CodANTT != body.CodANTT)
                mudancas.Add($"ANTT: {body.CodANTT} (Era {antes?.CodANTT})");
            if (antes?.Modelo != body.Modelo)
                mudancas.Add($"Modelo: {body.Modelo} (Era {antes?.Modelo})");

            if (antes?.CodEstado != body.CodEstado)
            {
                var nomeEstadoNovo = await GetNomeEstadoAsync(con, body.CodEstado);
                mudancas.Add($"Estado: {nomeEstadoNovo} (Era {antes?.Estado?.UF})");
            }

            if (antes?.CodMarca != body.CodMarca)
            {
                var nomeMarcaNova = await GetNomeMarcaAsync(con, body.CodMarca);
                mudancas.Add($"Marca: {nomeMarcaNova} (Era {antes?.Marca?.Marca})");
            }

            if (antes?.Ativo != body.Ativo)
                mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Veículo: {body.PlacaVeic}"
                : $"Editou Veículo: {body.PlacaVeic}. {diff}";

            await log.AddAsync("Veículos", "EDITOU", desc);
        }
        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string placa;
            await using (var sel = new MySqlCommand("SELECT PlacaVeic FROM Veiculos WHERE CodVeic = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                placa = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Veiculos WHERE CodVeic = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Veículos", "EXCLUIU", $"Excluiu Veículo: {placa}");
        }
        private static async Task<string> GetNomeEstadoAsync(MySqlConnection con, int codEstado)
        {
            await using var cmd = new MySqlCommand("SELECT CONCAT(Estado, ' (', UF, ')') FROM Estados WHERE CodEstado = @id", con);
            cmd.Parameters.AddWithValue("@id", codEstado);
            return (await cmd.ExecuteScalarAsync())?.ToString() ?? codEstado.ToString();
        }

        private static async Task<string> GetNomeMarcaAsync(MySqlConnection con, int? codMarca)
        {
            if (codMarca is null or 0) return "Nenhuma";
            await using var cmd = new MySqlCommand("SELECT Marca FROM Marcas WHERE codMarca = @id", con);
            cmd.Parameters.AddWithValue("@id", codMarca);
            return (await cmd.ExecuteScalarAsync())?.ToString() ?? codMarca.ToString()!;
        }

        static void Params(MySqlCommand cmd, Veiculos b)
        {
            cmd.Parameters.AddWithValue("@placaVeic", b.PlacaVeic);
            cmd.Parameters.AddWithValue("@placaMercoSul", b.PlacaMercoSul);
            cmd.Parameters.AddWithValue("@codEstado", b.CodEstado);
            cmd.Parameters.AddWithValue("@codANTT", b.CodANTT);
            cmd.Parameters.AddWithValue("@modelo", b.Modelo);
            cmd.Parameters.AddWithValue("@codMarca", (object?)b.CodMarca ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ativo", b.Ativo);
        }

        static Veiculos Map(MySqlDataReader rd) => new()
        {
            CodVeic = rd.GetInt32("CodVeic"),
            PlacaVeic = rd.IsDBNull(rd.GetOrdinal("PlacaVeic")) ? null : rd.GetString("PlacaVeic"),
            PlacaMercoSul = rd.IsDBNull(rd.GetOrdinal("PlacaMercoSul")) ? null : rd.GetString("PlacaMercoSul"),
            CodEstado = rd.GetInt32("CodEstado"),
            CodANTT = rd.IsDBNull(rd.GetOrdinal("CodANTT")) ? null : rd.GetString("CodANTT"),
            Modelo = rd.IsDBNull(rd.GetOrdinal("Modelo")) ? null : rd.GetString("Modelo"),
            CodMarca = rd.IsDBNull(rd.GetOrdinal("CodMarca")) ? null : rd.GetInt32("CodMarca"),
            Ativo = rd.GetBoolean("Ativo"),
            Estado = new Estados
            {
                CodEstado = rd.GetInt32("CodEstado"),
                UF = rd.IsDBNull(rd.GetOrdinal("UF")) ? null : rd.GetString("UF"),
                Estado = rd.IsDBNull(rd.GetOrdinal("Estado")) ? null : rd.GetString("Estado"),
                CodPais = rd.GetInt32("CodPais"),
                Ativo = rd.GetBoolean("EstadoAtivo"),
            },
            Marca = rd.IsDBNull(rd.GetOrdinal("CodMarca")) ? null : new Marcas
            {
                CodMarca = rd.GetInt32("CodMarca"),
                Marca = rd.IsDBNull(rd.GetOrdinal("Marca")) ? null : rd.GetString("Marca"),
                Ativo = rd.IsDBNull(rd.GetOrdinal("MarcaAtivo")) ? false : rd.GetBoolean("MarcaAtivo"),
            }
        };
    }
}