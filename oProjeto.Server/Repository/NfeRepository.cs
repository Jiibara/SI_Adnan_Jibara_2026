using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repositories
{
    public class NfeRepository
    {
        private readonly string _connectionString;

        public NfeRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("String de conexão não encontrada.");
        }

        private MySqlConnection Conn() => new(_connectionString);

        // 1. GET ALL
        public async Task<IEnumerable<Nfes>> GetAllAsync()
        {
            var list = new List<Nfes>();
            await using var con = Conn();
            await con.OpenAsync();

            string query = @"
        SELECT n.*, 
               f.Fornecedor AS Fornecedor, 
               t.Transportador AS Transportador
        FROM nfes n
        LEFT JOIN fornecedores f ON f.CodForn = n.CodForn
        LEFT JOIN transportadores t ON t.CodTransp = n.CodTransp
        ORDER BY n.DataEmit DESC, n.Numero DESC";

            await using var cmd = new MySqlCommand(query, con);
            await using var rd = await cmd.ExecuteReaderAsync();

            while (await rd.ReadAsync())
            {
                list.Add(MapNfeHeader((MySqlDataReader)rd));
            }

            return list;
        }

        // 2. GET BY ID
        public async Task<Nfes?> GetByIdAsync(int numero, int serie, int modelo, int codForn)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string query = @"
                SELECT n.*, f.Fornecedor, t.Transportador
                FROM nfes n
                LEFT JOIN fornecedores f ON f.CodForn = n.CodForn
                LEFT JOIN transportadores t ON t.CodTransp = n.CodTransp
                WHERE n.Numero = @numero AND n.Serie = @serie AND n.Modelo = @modelo AND n.CodForn = @codForn";

            await using var cmd = new MySqlCommand(query, con);
            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@codForn", codForn);

            await using var rd = await cmd.ExecuteReaderAsync();
            if (!await rd.ReadAsync()) return null;

            var nfe = MapNfeHeader((MySqlDataReader)rd);
            await rd.CloseAsync();

            nfe.Itens = await GetItensAsync(con, numero, serie, modelo, codForn);

            return nfe;
        }

        // 3. CREATE
        public async Task<Nfes> CreateAsync(Nfes body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var trans = await con.BeginTransactionAsync();

            try
            {
                string query = @"
                    INSERT INTO nfes (
                        Numero, Serie, Modelo, CodForn, Pagina, NatOper, ProtAcesso, DataProtAcesso, HoraProtAcesso,
                        ChaveAcesso, DataEmit, DataEnt, HoraEnt, BaseCalcIcms, ValorIcms, BaseCalcIcmsSub, ValorIcmsSub,
                        ValorFrete, ValorSeguro, Desconto, OutrasDesp, ValorIpi, CodTransp, FretePorConta, CodVeic,
                        Quantidade, Especie, Marca, PesoBruto, PesoLiq, InfComp, Ativo
                    ) VALUES (
                        @numero, @serie, @modelo, @codForn, @pagina, @natOper, @protAcesso, @dataProtAcesso, @horaProtAcesso,
                        @chaveAcesso, @dataEmit, @dataEnt, @horaEnt, @baseCalcIcms, @valorIcms, @baseCalcIcmsSub, @valorIcmsSub,
                        @valorFrete, @valorSeguro, @desconto, @outrasDesp, @valorIpi, @codTransp, @fretePorConta, @codVeic,
                        @quantidade, @especie, @marca, @pesoBruto, @pesoLiq, @infComp, @ativo
                    )";

                await using var cmd = new MySqlCommand(query, con, trans);
                AddHeaderParameters(cmd, body);
                await cmd.ExecuteNonQueryAsync();

                if (body.Itens != null && body.Itens.Count > 0)
                {
                    await SaveItensAsync(con, trans, body.Numero, body.Serie, body.Modelo, body.CodForn, body.Itens);
                }

                await trans.CommitAsync();
                return body;
            }
            catch
            {
                await trans.RollbackAsync();
                throw;
            }
        }

        // 4. UPDATE
        public async Task UpdateAsync(Nfes body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var trans = await con.BeginTransactionAsync();

            try
            {
                string query = @"
                    UPDATE nfes SET
                        Pagina = @pagina, NatOper = @natOper, ProtAcesso = @protAcesso, DataProtAcesso = @dataProtAcesso,
                        HoraProtAcesso = @horaProtAcesso, ChaveAcesso = @chaveAcesso, DataEmit = @dataEmit, DataEnt = @dataEnt,
                        HoraEnt = @horaEnt, BaseCalcIcms = @baseCalcIcms, ValorIcms = @valorIcms, BaseCalcIcmsSub = @baseCalcIcmsSub,
                        ValorIcmsSub = @valorIcmsSub, ValorFrete = @valorFrete, ValorSeguro = @valorSeguro, Desconto = @desconto,
                        OutrasDesp = @outrasDesp, ValorIpi = @valorIpi, CodTransp = @codTransp, FretePorConta = @fretePorConta,
                        CodVeic = @codVeic, Quantidade = @quantidade, Especie = @especie, Marca = @marca,
                        PesoBruto = @pesoBruto, PesoLiq = @pesoLiq, InfComp = @infComp, Ativo = @ativo
                    WHERE Numero = @numero AND Serie = @serie AND Modelo = @modelo AND CodForn = @codForn";

                await using var cmd = new MySqlCommand(query, con, trans);
                AddHeaderParameters(cmd, body);
                await cmd.ExecuteNonQueryAsync();

                await DeleteItensAsync(con, trans, body.Numero, body.Serie, body.Modelo, body.CodForn);
                if (body.Itens != null && body.Itens.Count > 0)
                {
                    await SaveItensAsync(con, trans, body.Numero, body.Serie, body.Modelo, body.CodForn, body.Itens);
                }

                await trans.CommitAsync();
            }
            catch
            {
                await trans.RollbackAsync();
                throw;
            }
        }

        // 5. DELETE
        public async Task DeleteAsync(int numero, int serie, int modelo, int codForn)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var trans = await con.BeginTransactionAsync();

            try
            {
                await DeleteItensAsync(con, trans, numero, serie, modelo, codForn);

                string query = @"
                    DELETE FROM nfes 
                    WHERE Numero = @numero AND Serie = @serie AND Modelo = @modelo AND CodForn = @codForn";

                await using var cmd = new MySqlCommand(query, con, trans);
                cmd.Parameters.AddWithValue("@numero", numero);
                cmd.Parameters.AddWithValue("@serie", serie);
                cmd.Parameters.AddWithValue("@modelo", modelo);
                cmd.Parameters.AddWithValue("@codForn", codForn);

                await cmd.ExecuteNonQueryAsync();
                await trans.CommitAsync();
            }
            catch
            {
                await trans.RollbackAsync();
                throw;
            }
        }

        #region MÉTODOS AUXILIARES DE ITENS (prodnfes)

        private async Task<List<ProdNfes>> GetItensAsync(MySqlConnection con, int numero, int serie, int modelo, int codForn)
        {
            var itens = new List<ProdNfes>();

            string query = @"
                SELECT pn.*, p.Produto
                FROM prodnfes pn
                LEFT JOIN produtos p ON p.CodProd = pn.CodProd
                WHERE pn.Numero = @numero AND pn.Serie = @serie AND pn.Modelo = @modelo AND pn.CodForn = @codForn";

            await using var cmd = new MySqlCommand(query, con);
            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@codForn", codForn);

            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
            {
                itens.Add(MapProdNfesItem((MySqlDataReader)rd));
            }

            return itens;
        }

        private static async Task SaveItensAsync(MySqlConnection con, MySqlTransaction trans, int numero, int serie, int modelo, int codForn, IEnumerable<ProdNfes> itens)
        {
            foreach (var item in itens)
            {
                string query = @"
                    INSERT INTO prodnfes (
                        Numero, Serie, Modelo, CodForn, CodProd, CSOSN, CFOP, Quantidade, ValorUnitario,
                        Desconto, ValorIcms, ValorIpi, AliqIcms, AliqIpi, BaseCalcIcms
                    ) VALUES (
                        @numero, @serie, @modelo, @codForn, @codProd, @csosn, @cfop, @quantidade, @valorUnitario,
                        @desconto, @valorIcms, @valorIpi, @aliqIcms, @aliqIpi, @baseCalcIcms
                    )";

                await using var cmd = new MySqlCommand(query, con, trans);
                cmd.Parameters.AddWithValue("@numero", numero);
                cmd.Parameters.AddWithValue("@serie", serie);
                cmd.Parameters.AddWithValue("@modelo", modelo);
                cmd.Parameters.AddWithValue("@codForn", codForn);
                cmd.Parameters.AddWithValue("@codProd", item.CodProd);
                cmd.Parameters.AddWithValue("@csosn", (object?)item.CSOSN ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@cfop", (object?)item.CFOP ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@quantidade", (object?)item.Quantidade ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@valorUnitario", (object?)item.ValorUnitario ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@desconto", (object?)item.Desconto ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@valorIcms", (object?)item.ValorIcms ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@valorIpi", (object?)item.ValorIpi ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@aliqIcms", (object?)item.AliqIcms ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@aliqIpi", (object?)item.AliqIpi ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@baseCalcIcms", (object?)item.BaseCalcIcms ?? DBNull.Value);

                await cmd.ExecuteNonQueryAsync();
            }
        }

        private static async Task DeleteItensAsync(MySqlConnection con, MySqlTransaction trans, int numero, int serie, int modelo, int codForn)
        {
            string query = @"
                DELETE FROM prodnfes 
                WHERE Numero = @numero AND Serie = @serie AND Modelo = @modelo AND CodForn = @codForn";

            await using var cmd = new MySqlCommand(query, con, trans);
            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@codForn", codForn);

            await cmd.ExecuteNonQueryAsync();
        }

        #endregion

        #region Mapeamento de Dados e Parâmetros

        private static void AddHeaderParameters(MySqlCommand cmd, Nfes b)
        {
            cmd.Parameters.AddWithValue("@numero", b.Numero);
            cmd.Parameters.AddWithValue("@serie", b.Serie);
            cmd.Parameters.AddWithValue("@modelo", b.Modelo);
            cmd.Parameters.AddWithValue("@codForn", b.CodForn);
            cmd.Parameters.AddWithValue("@pagina", (object?)b.Pagina ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@natOper", (object?)b.NatOper ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@protAcesso", (object?)b.ProtAcesso ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@dataProtAcesso", (object?)b.DataProtAcesso ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@horaProtAcesso", (object?)b.HoraProtAcesso ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@chaveAcesso", (object?)b.ChaveAcesso ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@dataEmit", (object?)b.DataEmit ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@dataEnt", (object?)b.DataEnt ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@horaEnt", (object?)b.HoraEnt ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@baseCalcIcms", (object?)b.BaseCalcIcms ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@valorIcms", (object?)b.ValorIcms ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@baseCalcIcmsSub", (object?)b.BaseCalcIcmsSub ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@valorIcmsSub", (object?)b.ValorIcmsSub ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@valorFrete", (object?)b.ValorFrete ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@valorSeguro", (object?)b.ValorSeguro ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@desconto", (object?)b.Desconto ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@outrasDesp", (object?)b.OutrasDesp ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@valorIpi", (object?)b.ValorIpi ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@codTransp", (object?)b.CodTransp ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@fretePorConta", (object?)b.FretePorConta ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@codVeic", (object?)b.CodVeic ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@quantidade", (object?)b.Quantidade ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@especie", (object?)b.Especie ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@marca", (object?)b.Marca ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@pesoBruto", (object?)b.PesoBruto ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@pesoLiq", (object?)b.PesoLiq ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@infComp", (object?)b.InfComp ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ativo", b.Ativo);
        }

        private static Nfes MapNfeHeader(MySqlDataReader rd) => new()
        {
            Numero = rd.GetInt32(rd.GetOrdinal("Numero")),
            Serie = rd.GetInt32(rd.GetOrdinal("Serie")),
            Modelo = rd.GetInt32(rd.GetOrdinal("Modelo")),
            CodForn = rd.GetInt32(rd.GetOrdinal("CodForn")),
            Pagina = rd.IsDBNull(rd.GetOrdinal("Pagina")) ? null : rd.GetInt32(rd.GetOrdinal("Pagina")),
            NatOper = rd.IsDBNull(rd.GetOrdinal("NatOper")) ? null : rd.GetString(rd.GetOrdinal("NatOper")),
            ProtAcesso = rd.IsDBNull(rd.GetOrdinal("ProtAcesso")) ? null : rd.GetString(rd.GetOrdinal("ProtAcesso")),

            // Trata datas com conversão segura
            DataProtAcesso = rd.IsDBNull(rd.GetOrdinal("DataProtAcesso")) ? null : DateOnly.FromDateTime(rd.GetDateTime(rd.GetOrdinal("DataProtAcesso"))),
            HoraProtAcesso = rd.IsDBNull(rd.GetOrdinal("HoraProtAcesso")) ? null : TimeOnly.FromTimeSpan(rd.GetTimeSpan(rd.GetOrdinal("HoraProtAcesso"))),
            ChaveAcesso = rd.IsDBNull(rd.GetOrdinal("ChaveAcesso")) ? null : rd.GetString(rd.GetOrdinal("ChaveAcesso")),

            DataEmit = rd.IsDBNull(rd.GetOrdinal("DataEmit")) ? null : DateOnly.FromDateTime(rd.GetDateTime(rd.GetOrdinal("DataEmit"))),
            DataEnt = rd.IsDBNull(rd.GetOrdinal("DataEnt")) ? null : DateOnly.FromDateTime(rd.GetDateTime(rd.GetOrdinal("DataEnt"))),
            HoraEnt = rd.IsDBNull(rd.GetOrdinal("HoraEnt")) ? null : TimeOnly.FromTimeSpan(rd.GetTimeSpan(rd.GetOrdinal("HoraEnt"))),

            BaseCalcIcms = rd.IsDBNull(rd.GetOrdinal("BaseCalcIcms")) ? null : rd.GetDecimal(rd.GetOrdinal("BaseCalcIcms")),
            ValorIcms = rd.IsDBNull(rd.GetOrdinal("ValorIcms")) ? null : rd.GetDecimal(rd.GetOrdinal("ValorIcms")),
            BaseCalcIcmsSub = rd.IsDBNull(rd.GetOrdinal("BaseCalcIcmsSub")) ? null : rd.GetDecimal(rd.GetOrdinal("BaseCalcIcmsSub")),
            ValorIcmsSub = rd.IsDBNull(rd.GetOrdinal("ValorIcmsSub")) ? null : rd.GetDecimal(rd.GetOrdinal("ValorIcmsSub")),
            ValorFrete = rd.IsDBNull(rd.GetOrdinal("ValorFrete")) ? null : rd.GetDecimal(rd.GetOrdinal("ValorFrete")),
            ValorSeguro = rd.IsDBNull(rd.GetOrdinal("ValorSeguro")) ? null : rd.GetDecimal(rd.GetOrdinal("ValorSeguro")),
            Desconto = rd.IsDBNull(rd.GetOrdinal("Desconto")) ? null : rd.GetDecimal(rd.GetOrdinal("Desconto")),
            OutrasDesp = rd.IsDBNull(rd.GetOrdinal("OutrasDesp")) ? null : rd.GetDecimal(rd.GetOrdinal("OutrasDesp")),
            ValorIpi = rd.IsDBNull(rd.GetOrdinal("ValorIpi")) ? null : rd.GetDecimal(rd.GetOrdinal("ValorIpi")),
            CodTransp = rd.IsDBNull(rd.GetOrdinal("CodTransp")) ? null : rd.GetInt32(rd.GetOrdinal("CodTransp")),
            FretePorConta = rd.IsDBNull(rd.GetOrdinal("FretePorConta")) ? null : rd.GetString(rd.GetOrdinal("FretePorConta")),
            CodVeic = rd.IsDBNull(rd.GetOrdinal("CodVeic")) ? null : rd.GetInt32(rd.GetOrdinal("CodVeic")),
            Quantidade = rd.IsDBNull(rd.GetOrdinal("Quantidade")) ? null : rd.GetInt32(rd.GetOrdinal("Quantidade")),
            Especie = rd.IsDBNull(rd.GetOrdinal("Especie")) ? null : rd.GetString(rd.GetOrdinal("Especie")),
            Marca = rd.IsDBNull(rd.GetOrdinal("Marca")) ? null : rd.GetString(rd.GetOrdinal("Marca")),
            PesoBruto = rd.IsDBNull(rd.GetOrdinal("PesoBruto")) ? null : rd.GetDecimal(rd.GetOrdinal("PesoBruto")),
            PesoLiq = rd.IsDBNull(rd.GetOrdinal("PesoLiq")) ? null : rd.GetDecimal(rd.GetOrdinal("PesoLiq")),
            InfComp = rd.IsDBNull(rd.GetOrdinal("InfComp")) ? null : rd.GetString(rd.GetOrdinal("InfComp")),

            // Trata coluna booleana evitando nulos
            Ativo = !rd.IsDBNull(rd.GetOrdinal("Ativo")) && rd.GetBoolean(rd.GetOrdinal("Ativo")),


            Fornecedor = rd.IsDBNull(rd.GetOrdinal("Fornecedor")) ? null : new Fornecedores { Fornecedor = rd.GetString(rd.GetOrdinal("Fornecedor")) },
            Transportador = rd.IsDBNull(rd.GetOrdinal("Transportador")) ? null : new Transportadores { Transportador = rd.GetString(rd.GetOrdinal("Transportador")) }
        };

        private static ProdNfes MapProdNfesItem(MySqlDataReader rd) => new()
        {
            Numero = rd.GetInt32(rd.GetOrdinal("Numero")),
            Serie = rd.GetInt32(rd.GetOrdinal("Serie")),
            Modelo = rd.GetInt32(rd.GetOrdinal("Modelo")),
            CodForn = rd.GetInt32(rd.GetOrdinal("CodForn")),
            CodProd = rd.GetInt32(rd.GetOrdinal("CodProd")),
            CSOSN = rd.IsDBNull(rd.GetOrdinal("CSOSN")) ? null : rd.GetString(rd.GetOrdinal("CSOSN")),
            CFOP = rd.IsDBNull(rd.GetOrdinal("CFOP")) ? null : rd.GetString(rd.GetOrdinal("CFOP")),
            Quantidade = rd.IsDBNull(rd.GetOrdinal("Quantidade")) ? null : rd.GetDecimal(rd.GetOrdinal("Quantidade")),
            ValorUnitario = rd.IsDBNull(rd.GetOrdinal("ValorUnitario")) ? null : rd.GetDecimal(rd.GetOrdinal("ValorUnitario")),
            Desconto = rd.IsDBNull(rd.GetOrdinal("Desconto")) ? null : rd.GetDecimal(rd.GetOrdinal("Desconto")),
            ValorIcms = rd.IsDBNull(rd.GetOrdinal("ValorIcms")) ? null : rd.GetDecimal(rd.GetOrdinal("ValorIcms")),
            ValorIpi = rd.IsDBNull(rd.GetOrdinal("ValorIpi")) ? null : rd.GetDecimal(rd.GetOrdinal("ValorIpi")),
            AliqIcms = rd.IsDBNull(rd.GetOrdinal("AliqIcms")) ? null : rd.GetDecimal(rd.GetOrdinal("AliqIcms")),
            AliqIpi = rd.IsDBNull(rd.GetOrdinal("AliqIpi")) ? null : rd.GetDecimal(rd.GetOrdinal("AliqIpi")),
            BaseCalcIcms = rd.IsDBNull(rd.GetOrdinal("BaseCalcIcms")) ? null : rd.GetDecimal(rd.GetOrdinal("BaseCalcIcms")),
            Produto = rd.IsDBNull(rd.GetOrdinal("Produto")) ? null : new Produtos { Produto = rd.GetString(rd.GetOrdinal("Produto")) }
        };

        #endregion
    }
}