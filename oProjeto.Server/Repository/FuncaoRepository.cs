using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class FuncaoRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Funcoes>> GetAllAsync()
        {
            var list = new List<Funcoes>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
            SELECT * FROM Funcoes
            ORDER BY CodFuncao ASC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<Funcoes?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
            SELECT * FROM Funcoes
            WHERE CodFuncao = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? Map(rd) : null;
        }

        public async Task<Funcoes> CreateAsync(Funcoes body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
            INSERT INTO Funcoes (Funcao, SalarioBase, Ativo)
            VALUES (@funcao, @salarioBase, @ativo);
            SELECT LAST_INSERT_ID();", con);
            Params(cmd, body);
            body.CodFuncao = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Funcoes", "CRIOU", $"Criou Função: {body.Funcao}");
            return body;
        }

        public async Task UpdateAsync(Funcoes body)
        {
            var antes = await GetByIdAsync(body.CodFuncao);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
            UPDATE Funcoes SET
                Funcao      = @funcao,
                SalarioBase = @salarioBase,
                Ativo       = @ativo
            WHERE CodFuncao = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodFuncao);
            Params(cmd, body);
            await cmd.ExecuteNonQueryAsync();

            var mudancas = new List<string>();

            if (antes?.Funcao != body.Funcao) 
                mudancas.Add($"Função: {body.Funcao} (Era {antes?.Funcao})");
            if (antes?.salarioBase != body.salarioBase)
                mudancas.Add($"Salário Base: {body.salarioBase:C} (Era {antes?.salarioBase:C})");
            if (antes?.Ativo != body.Ativo) 
                mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Função: {body.Funcao}"
                : $"Editou Função: {body.Funcao}. {diff}";

            await log.AddAsync("Funcoes", "EDITOU", desc);
        }

        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT Funcao FROM Funcoes WHERE CodFuncao = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Funcoes WHERE CodFuncao = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Funcoes", "EXCLUIU", $"Excluiu Função: {nome}");
        }

        static void Params(MySqlCommand cmd, Funcoes b)
        {
            cmd.Parameters.AddWithValue("@funcao", b.Funcao);
            cmd.Parameters.AddWithValue("@salarioBase", b.salarioBase);
            cmd.Parameters.AddWithValue("@ativo", b.Ativo);
        }

        static Funcoes Map(MySqlDataReader rd) => new()
        {
            CodFuncao = rd.GetInt32("CodFuncao"),
            Funcao = rd.IsDBNull(rd.GetOrdinal("Funcao")) ? null : rd.GetString("Funcao"),
            salarioBase = rd.IsDBNull(rd.GetOrdinal("SalarioBase")) ? 0 : rd.GetDecimal("SalarioBase"),
            Ativo = rd.GetBoolean("Ativo"),
        };
    }
}
