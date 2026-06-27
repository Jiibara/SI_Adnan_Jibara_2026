using MySqlConnector;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Repository
{
    public class ProdutoRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Produtos>> GetAllAsync()
        {
            var list = new List<Produtos>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT p.*,
                    c.Categoria,
                    m.Marca
                FROM Produtos p
                LEFT JOIN Categorias c ON c.CodCategoria = p.CodCategoria
                LEFT JOIN Marcas m ON m.CodMarca = p.CodMarca
                ORDER BY p.CodProd ASC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }//                    n.AliqIcms, n.AliqIpi, n.Ativo AS NcmAtivo,       LEFT JOIN NcmShs n ON n.NcmSh = p.NcmSh



        public async Task<Produtos?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT p.*,
                    c.Categoria,
                    m.Marca
                FROM Produtos p
                LEFT JOIN Categorias c ON c.CodCategoria = p.CodCategoria
                LEFT JOIN Marcas m ON m.CodMarca = p.CodMarca
                WHERE p.CodProd = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? Map(rd) : null;
        }//                    n.AliqIcms, n.AliqIpi, n.Ativo AS NcmAtivo,                 LEFT JOIN NcmShs n ON n.NcmSh = p.NcmSh



        public async Task<Produtos> CreateAsync(Produtos body) // sem Ncm
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO Produtos (Produto, Unidade, PesoBruto, PesoLiq, Saldo, PrecoCompra, PrecoVenda, CustoMedio, CodCategoria, CodMarca, Ativo)
                VALUES (@produto, @unidade, @pesoBruto, @pesoLiq, @saldo, @precoCompra, @precoVenda, @custoMedio, @codCategoria, @codMarca, @ativo);
                SELECT LAST_INSERT_ID();", con);
            Params(cmd, body);
            body.CodProd = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Produtos", "CRIOU", $"Criou Produto: {body.Produto}");
            return body;
        }

        public async Task UpdateAsync(Produtos body) // sem Ncm
        {
            var antes = await GetByIdAsync(body.CodProd);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"UPDATE Produtos 
                                                     SET Produto = @produto, Unidade = @unidade, PesoBruto = @pesoBruto,
                                                         PesoLiq = @pesoLiq, Saldo = @saldo, PrecoCompra = @precoCompra, PrecoVenda = @precoVenda, 
                                                         CustoMedio = @custoMedio, CodCategoria = @codCategoria, CodMarca = @codMarca, Ativo = @ativo
                                                     WHERE CodProd = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodProd);
            Params(cmd, body);
            await cmd.ExecuteNonQueryAsync();

            var mudancas = new List<string>();

            if (antes?.Produto != body.Produto) 
                mudancas.Add($"Produto: {body.Produto} (Era {antes?.Produto})");
            //if (antes?.NcmSh != body.NcmSh) mudancas.Add($"NCM/SH: {body.NcmSh} (Era {antes?.NcmSh})");
            if (antes?.Unidade != body.Unidade) 
                mudancas.Add($"Unidade: {body.Unidade} (Era {antes?.Unidade})");
            if (antes?.PesoBruto != body.PesoBruto)
                mudancas.Add($"Peso Bruto: {body.PesoBruto} (Era {antes?.PesoBruto})");
            if (antes?.PesoLiq != body.PesoLiq)
                mudancas.Add($"Peso Líq.: {body.PesoLiq} (Era {antes?.PesoLiq})");
            if (antes?.Saldo != body.Saldo) 
                mudancas.Add($"Saldo: {body.Saldo} (Era {antes?.Saldo})");
            if (antes?.PrecoCompra != body.PrecoCompra)
                mudancas.Add($"Preço Compra: {body.PrecoCompra} (Era {antes?.PrecoCompra})");
            if (antes?.PrecoVenda != body.PrecoVenda)
                mudancas.Add($"Preço Venda: {body.PrecoVenda} (Era {antes?.PrecoVenda})");
            if (antes?.CustoMedio != body.CustoMedio)
                mudancas.Add($"Custo Médio: {body.CustoMedio} (Era {antes?.CustoMedio})");
            if (antes?.CodCategoria != body.CodCategoria) mudancas.Add($"Categoria: {body.CodCategoria} (Era {antes?.CodCategoria})");
            if (antes?.CodMarca != body.CodMarca)
                mudancas.Add($"Marca: {body.CodMarca} (Era {antes?.CodMarca})");
            if (antes?.Ativo != body.Ativo)
                mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Produto: {body.Produto}"
                : $"Editou Produto: {body.Produto}. {diff}";

            await log.AddAsync("Produtos", "EDITOU", desc);
        }

        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT Produto FROM Produtos WHERE CodProd = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Produtos WHERE CodProd = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Produtos", "EXCLUIU", $"Excluiu Produto: {nome}");
        }

        static void Params(MySqlCommand cmd, Produtos b)
        {
            cmd.Parameters.AddWithValue("@produto", b.Produto);
            //cmd.Parameters.AddWithValue("@ncmSh", b.NcmSh);
            cmd.Parameters.AddWithValue("@unidade", b.Unidade);
            cmd.Parameters.AddWithValue("@pesoBruto", b.PesoBruto);
            cmd.Parameters.AddWithValue("@pesoLiq", b.PesoLiq);
            cmd.Parameters.AddWithValue("@saldo", b.Saldo);
            cmd.Parameters.AddWithValue("@precoCompra", b.PrecoCompra);
            cmd.Parameters.AddWithValue("@precoVenda", b.PrecoVenda);
            cmd.Parameters.AddWithValue("@custoMedio", b.CustoMedio);
            cmd.Parameters.AddWithValue("@codCategoria", b.CodCategoria);
            cmd.Parameters.AddWithValue("@codMarca", b.CodMarca);
            cmd.Parameters.AddWithValue("@ativo", b.Ativo);
        }

        static Produtos Map(MySqlDataReader rd) => new()
        {
            CodProd = rd.GetInt32("CodProd"),
            Produto = rd.GetString("Produto"),
            //NcmSh = rd.GetString("NcmSh"),
            Unidade = rd.IsDBNull(rd.GetOrdinal("Unidade")) ? null : rd.GetString("Unidade"),
            PesoBruto = rd.IsDBNull(rd.GetOrdinal("PesoBruto")) ? 0 : rd.GetDecimal("PesoBruto"),
            PesoLiq = rd.IsDBNull(rd.GetOrdinal("PesoLiq")) ? 0 : rd.GetDecimal("PesoLiq"),
            Saldo = rd.IsDBNull(rd.GetOrdinal("Saldo")) ? 0 : rd.GetDecimal("Saldo"),
            PrecoCompra = rd.IsDBNull(rd.GetOrdinal("PrecoCompra")) ? 0 : rd.GetDecimal("PrecoCompra"),
            PrecoVenda = rd.IsDBNull(rd.GetOrdinal("PrecoVenda")) ? 0 : rd.GetDecimal("PrecoVenda"),
            CustoMedio = rd.IsDBNull(rd.GetOrdinal("CustoMedio")) ? 0 : rd.GetDecimal("CustoMedio"),
            CodCategoria = rd.IsDBNull(rd.GetOrdinal("CodCategoria")) ? 0 : rd.GetInt32("CodCategoria"),
            CodMarca = rd.IsDBNull(rd.GetOrdinal("CodMarca")) ? 0 : rd.GetInt32("CodMarca"),
            Ativo = rd.GetBoolean("Ativo"),
            /*NcmShs = rd.IsDBNull(rd.GetOrdinal("NcmAtivo")) ? null : new NcmShs
            {
                NcmSh = rd.GetString("NcmSh"),
                AliqIcms = rd.IsDBNull(rd.GetOrdinal("AliqIcms")) ? null : rd.GetDecimal("AliqIcms"),
                AliqIpi = rd.IsDBNull(rd.GetOrdinal("AliqIpi")) ? null : rd.GetDecimal("AliqIpi"),
                Ativo = rd.GetBoolean("NcmAtivo"),
            },*/
            Categoria = rd.IsDBNull(rd.GetOrdinal("CodCategoria")) ? null : new Categorias
            {
                CodCategoria = rd.GetInt32("CodCategoria"),
                Categoria = rd.IsDBNull(rd.GetOrdinal("Categoria")) ? null : rd.GetString("Categoria"),
            },
            Marca = rd.IsDBNull(rd.GetOrdinal("CodMarca")) ? null : new Marcas
            {
                CodMarca = rd.GetInt32("CodMarca"),
                Marca = rd.IsDBNull(rd.GetOrdinal("Marca")) ? null : rd.GetString("Marca"),
            },
        };
    }
}