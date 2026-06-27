using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class LogRepository(IConfiguration cfg)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Log>> GetAllAsync()
        {
            var list = new List<Log>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT * FROM Logs ORDER BY CriadoEm DESC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(new Log
                {
                    CodLog = rd.GetInt32("CodLog"),
                    Entidade = rd.GetString("Entidade"),
                    Acao = rd.GetString("Acao"),
                    Descricao = rd.GetString("Descricao"),
                    CriadoEm = rd.GetDateTime("CriadoEm"),
                });
            return list;
        }

        public async Task AddAsync(string entidade, string acao, string descricao)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO Logs (Entidade, Acao, Descricao, CriadoEm)
                VALUES (@entidade, @acao, @descricao, @criadoEm)", con);
            cmd.Parameters.AddWithValue("@entidade", entidade);
            cmd.Parameters.AddWithValue("@acao", acao);
            cmd.Parameters.AddWithValue("@descricao", descricao);
            cmd.Parameters.AddWithValue("@criadoEm", DateTime.Now);
            await cmd.ExecuteNonQueryAsync();
        }
    }
}