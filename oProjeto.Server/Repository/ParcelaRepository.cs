using MySqlConnector;
using oProjeto.Server.Models;

/*namespace oProjeto.Server.Repository
{
    public class ParcelaRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Parcelas>> GetAllAsync()
        {
            var list = new List<Parcelas>();

            await using var con = Conn();
            await con.OpenAsync();

            await using var cmd = new MySqlCommand(@"
                SELECT p.*, 
                       f.FormaPagamento,
                       f.Ativo AS FpAtivo
                FROM Parcelas p
                LEFT JOIN FormaPagamentos f
                    ON f.CodFormaPagamento = p.CodFormaPagamento
                ORDER BY p.NumeroParcela", con);

            await using var rd = await cmd.ExecuteReaderAsync();

            while (await rd.ReadAsync())
                list.Add(Map(rd));

            return list;
        }

        public async Task<IEnumerable<Parcelas>> GetByCondicaoAsync(int codCondicao)
        {
            var list = new List<Parcelas>();

            await using var con = Conn();
            await con.OpenAsync();

            await using var cmd = new MySqlCommand(@"
                SELECT p.*, 
                       f.FormaPagamento,
                       f.Ativo AS FpAtivo
                FROM Parcelas p
                LEFT JOIN FormaPagamentos f
                    ON f.CodFormaPagamento = p.CodFormaPagamento
                WHERE p.CodCondicao = @codCondicao
                ORDER BY p.NumeroParcela", con);

            cmd.Parameters.AddWithValue("@codCondicao", codCondicao);

            await using var rd = await cmd.ExecuteReaderAsync();

            while (await rd.ReadAsync())
                list.Add(Map(rd));

            return list;
        }

        public async Task<Parcelas?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            await using var cmd = new MySqlCommand(@"
                SELECT p.*, 
                       f.FormaPagamento,
                       f.Ativo AS FpAtivo
                FROM Parcelas p
                LEFT JOIN FormaPagamentos f
                    ON f.CodFormaPagamento = p.CodFormaPagamento
                WHERE p.CodParcela = @id", con);

            cmd.Parameters.AddWithValue("@id", id);

            await using var rd = await cmd.ExecuteReaderAsync();

            if (!await rd.ReadAsync())
                return null;

            return Map(rd);
        }

        public async Task<Parcelas> CreateAsync(Parcelas parcela)
        {
            await using var con = Conn();
            await con.OpenAsync();

            await using var cmd = new MySqlCommand(@"
        INSERT INTO Parcelas
            (NumeroParcela, Percentual, Dias, CodCondicao, CodFormaPagamento)
        VALUES
            (@numero, @percentual, @dias, @codCondicao, @codFormaPagamento);

        SELECT LAST_INSERT_ID();", con);

            cmd.Parameters.AddWithValue("@numero", parcela.NumeroParcela);
            cmd.Parameters.AddWithValue("@percentual", parcela.Percentual);
            cmd.Parameters.AddWithValue("@dias", parcela.Dias);
            cmd.Parameters.AddWithValue("@codCondicao", parcela.CodCondicao);
            cmd.Parameters.AddWithValue("@codFormaPagamento", parcela.CodFormaPagamento);

            parcela.CodParcela = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync(
                "Parcelas",
                "CRIOU",
                $"Criou parcela {parcela.NumeroParcela} da condição {parcela.CodCondicao}");

            return parcela;
        }

        public async Task UpdateAsync(Parcelas parcela)
        {
            await using var con = Conn();
            await con.OpenAsync();

            await using var cmd = new MySqlCommand(@"
        UPDATE Parcelas
        SET NumeroParcela = @numero,
            Percentual = @percentual,
            Dias = @dias,
            CodCondicao = @codCondicao,
            CodFormaPagamento = @codFormaPagamento
        WHERE CodParcela = @id", con);

            cmd.Parameters.AddWithValue("@id", parcela.CodParcela);
            cmd.Parameters.AddWithValue("@numero", parcela.NumeroParcela);
            cmd.Parameters.AddWithValue("@percentual", parcela.Percentual);
            cmd.Parameters.AddWithValue("@dias", parcela.Dias);
            cmd.Parameters.AddWithValue("@codCondicao", parcela.CodCondicao);
            cmd.Parameters.AddWithValue("@codFormaPagamento", parcela.CodFormaPagamento);

            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync(
                "Parcelas",
                "EDITOU",
                $"Editou parcela {parcela.NumeroParcela} (Código {parcela.CodParcela})");
        }

        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string descricao = "";

            await using (var busca = new MySqlCommand(
                "SELECT NumeroParcela FROM Parcelas WHERE CodParcela = @id", con))
            {
                busca.Parameters.AddWithValue("@id", id);

                var result = await busca.ExecuteScalarAsync();

                if (result != null)
                    descricao = result.ToString()!;
            }

            await using var cmd = new MySqlCommand(
                "DELETE FROM Parcelas WHERE CodParcela = @id", con);

            cmd.Parameters.AddWithValue("@id", id);

            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync(
                "Parcelas",
                "EXCLUIU",
                $"Excluiu parcela {descricao}");
        }

        private static Parcelas Map(MySqlDataReader rd) => new()
        {
            CodParcela = rd.GetInt32("CodParcela"),
            NumeroParcela = rd.GetInt32("NumeroParcela"),
            Percentual = rd.GetDecimal("Percentual"),
            Dias = rd.GetInt32("Dias"),
            CodCondicao = rd.GetInt32("CodCondicao"),
            CodFormaPagamento = rd.GetInt32("CodFormaPagamento"),

            FormaPagamento =
                rd.IsDBNull(rd.GetOrdinal("FormaPagamento"))
                ? null
                : new FormaPagamentos
                {
                    CodFormaPagamento = rd.GetInt32("CodFormaPagamento"),
                    FormaPagamento = rd.GetString("FormaPagamento"),
                    Ativo = rd.GetBoolean("FpAtivo")
                }
        };
    }
}*/