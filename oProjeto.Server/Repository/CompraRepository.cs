using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class CompraRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Compras>> GetAllAsync()
        {
            var list = new List<Compras>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT c.*, f.fornecedor AS FornecedorNome, f.nomeFantasia AS FornecedorNomeFantasia,
                       cp.condicaoPagamento AS CondicaoNome
                FROM compras c
                LEFT JOIN fornecedores f ON f.codForn = c.codForn
                LEFT JOIN condicaopagamentos cp ON cp.codCondicao = c.codCondicao
                ORDER BY c.numero DESC, c.serie ASC, c.modelo ASC, c.codForn ASC;", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<IEnumerable<Compras>> GetByFornecedorAsync(int codForn)
        {
            var list = new List<Compras>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT c.*, f.fornecedor AS FornecedorNome, f.nomeFantasia AS FornecedorNomeFantasia,
                       cp.condicaoPagamento AS CondicaoNome
                FROM compras c
                LEFT JOIN fornecedores f ON f.codForn = c.codForn
                LEFT JOIN condicaopagamentos cp ON cp.codCondicao = c.codCondicao
                WHERE c.codForn = @codForn
                ORDER BY c.numero DESC, c.serie ASC, c.modelo ASC;", con);
            cmd.Parameters.AddWithValue("@codForn", codForn);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<IEnumerable<Compras>> GetPendentesAsync(int codForn)
        {
            var list = new List<Compras>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT c.*, f.fornecedor AS FornecedorNome, f.nomeFantasia AS FornecedorNomeFantasia,
                       cp.condicaoPagamento AS CondicaoNome
                FROM compras c
                LEFT JOIN fornecedores f ON f.codForn = c.codForn
                LEFT JOIN condicaopagamentos cp ON cp.codCondicao = c.codCondicao
                WHERE c.codForn = @codForn
                  AND c.situacao IN ('PENDENTE', 'ABERTA', 'PARCIAL')
                  AND EXISTS (
                      SELECT 1
                      FROM produtosCompras pc
                      WHERE pc.numero = c.numero
                        AND pc.serie = c.serie
                        AND pc.modelo = c.modelo
                        AND pc.codForn = c.codForn
                        AND pc.quantidade > COALESCE(pc.quantidadeRecebida, 0)
                  )
                ORDER BY c.numero DESC, c.serie ASC, c.modelo ASC;", con);
            cmd.Parameters.AddWithValue("@codForn", codForn);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<Compras?> GetByIdAsync(string numero, string serie, string modelo, int codForn)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT c.*, f.fornecedor AS FornecedorNome, f.nomeFantasia AS FornecedorNomeFantasia,
                       cp.condicaoPagamento AS CondicaoNome
                FROM compras c
                LEFT JOIN fornecedores f ON f.codForn = c.codForn
                LEFT JOIN condicaopagamentos cp ON cp.codCondicao = c.codCondicao
                WHERE c.numero = @numero AND c.serie = @serie
                  AND c.modelo = @modelo AND c.codForn = @codForn;", con);
            AddKeyParams(cmd, numero, serie, modelo, codForn);
            await using var rd = await cmd.ExecuteReaderAsync();
            if (!await rd.ReadAsync()) return null;
            var compra = Map(rd);
            await rd.CloseAsync();
            compra.Produtos = await GetProdutosAsync(con, numero, serie, modelo, codForn);
            return compra;
        }

        public async Task<Compras> CreateAsync(Compras body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();
            try
            {
                await using (var check = new MySqlCommand(@"
                    SELECT COUNT(*) FROM compras
                    WHERE numero = @numero AND serie = @serie
                      AND modelo = @modelo AND codForn = @codForn;", con, tx))
                {
                    AddKeyParams(check, body.Numero, body.Serie, body.Modelo, body.CodForn);
                    if (Convert.ToInt32(await check.ExecuteScalarAsync()) > 0)
                        throw new InvalidOperationException("Já existe uma compra com esta chave.");
                }

                await using (var cmd = new MySqlCommand(@"
                    INSERT INTO compras (numero, serie, modelo, codForn, dataCompra, dataPrevisaoEntrega,
                        codCondicao, valorProdutos, valorDesconto, valorFrete, valorSeguro,
                        outrasDespesas, valorTotal, observacoes, situacao)
                    VALUES (@numero, @serie, @modelo, @codForn, @dataCompra, @dataPrevisaoEntrega,
                        @codCondicao, @valorProdutos, @valorDesconto, @valorFrete, @valorSeguro,
                        @outrasDespesas, @valorTotal, @observacoes, @situacao);", con, tx))
                {
                    AddParams(cmd, body);
                    await cmd.ExecuteNonQueryAsync();
                }

                foreach (var item in body.Produtos ?? [])
                    await InserirItemAsync(con, tx, body.Numero, body.Serie, body.Modelo, body.CodForn, item);

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync("Compras", "CRIOU", $"Criou Compra: Nº {body.Numero}/{body.Serie}, Modelo {body.Modelo}, Fornecedor {body.CodForn}");
            return body;
        }

        public async Task UpdateAsync(Compras body)
        {
            var antes = await GetByIdAsync(body.Numero, body.Serie, body.Modelo, body.CodForn);
            if (antes is null) throw new KeyNotFoundException("Compra não encontrada.");

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();
            try
            {
                await using (var cmd = new MySqlCommand(@"
                    UPDATE compras SET dataCompra = @dataCompra,
                        dataPrevisaoEntrega = @dataPrevisaoEntrega, codCondicao = @codCondicao,
                        valorProdutos = @valorProdutos, valorDesconto = @valorDesconto,
                        valorFrete = @valorFrete, valorSeguro = @valorSeguro,
                        outrasDespesas = @outrasDespesas, valorTotal = @valorTotal,
                        observacoes = @observacoes, situacao = @situacao
                    WHERE numero = @numero AND serie = @serie
                      AND modelo = @modelo AND codForn = @codForn;", con, tx))
                {
                    AddParams(cmd, body);
                    await cmd.ExecuteNonQueryAsync();
                }

                await using (var del = new MySqlCommand(@"
                    DELETE FROM produtosCompras
                    WHERE numero = @numero AND serie = @serie
                      AND modelo = @modelo AND codForn = @codForn;", con, tx))
                {
                    AddKeyParams(del, body.Numero, body.Serie, body.Modelo, body.CodForn);
                    await del.ExecuteNonQueryAsync();
                }

                foreach (var item in body.Produtos ?? [])
                {
                    var anterior = antes.Produtos.FirstOrDefault(p => p.CodProd == item.CodProd);
                    item.QuantidadeRecebida = anterior?.QuantidadeRecebida ?? 0;
                    if (item.Quantidade < item.QuantidadeRecebida)
                        throw new InvalidOperationException($"A quantidade do produto {item.CodProd} não pode ser menor que a quantidade já recebida ({item.QuantidadeRecebida}).");
                    await InserirItemAsync(con, tx, body.Numero, body.Serie, body.Modelo, body.CodForn, item);
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            var changes = new List<string>();
            if (antes.DataCompra != body.DataCompra) changes.Add($"Data Compra: {body.DataCompra:d} (Era {antes.DataCompra:d})");
            if (antes.DataPrevisaoEntrega != body.DataPrevisaoEntrega) changes.Add($"Previsão Entrega: {body.DataPrevisaoEntrega:d} (Era {antes.DataPrevisaoEntrega:d})");
            if (antes.CodCondicao != body.CodCondicao) changes.Add($"Condição Pagamento: {body.CodCondicao} (Era {antes.CodCondicao})");
            if (antes.ValorTotal != body.ValorTotal) changes.Add($"Valor Total: {body.ValorTotal:C} (Era {antes.ValorTotal:C})");
            if (antes.Situacao != body.Situacao) changes.Add($"Situação: {body.Situacao} (Era {antes.Situacao})");
            if (antes.Produtos.Count != (body.Produtos?.Count ?? 0)) changes.Add($"Itens: {body.Produtos?.Count ?? 0} (Era {antes.Produtos.Count})");

            var diff = changes.Count > 0 ? string.Join(". ", changes) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Compra: Nº {body.Numero}/{body.Serie}"
                : $"Editou Compra: Nº {body.Numero}/{body.Serie}. {diff}";
            await log.AddAsync("Compras", "EDITOU", desc);
        }

        public async Task DeleteAsync(string numero, string serie, string modelo, int codForn)
        {
            var compra = await GetByIdAsync(numero, serie, modelo, codForn);
            if (compra is null) throw new KeyNotFoundException("Compra não encontrada.");

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                DELETE FROM compras
                WHERE numero = @numero AND serie = @serie
                  AND modelo = @modelo AND codForn = @codForn;", con);
            AddKeyParams(cmd, numero, serie, modelo, codForn);
            await cmd.ExecuteNonQueryAsync();
            await log.AddAsync("Compras", "EXCLUIU", $"Excluiu Compra: Nº {numero}/{serie}, Modelo {modelo}, Fornecedor {codForn}");
        }

        private static async Task<List<ProdutosCompras>> GetProdutosAsync(MySqlConnection con, string numero, string serie, string modelo, int codForn)
        {
            var list = new List<ProdutosCompras>();
            await using var cmd = new MySqlCommand(@"
                SELECT pc.*, p.produto, p.unidade
                FROM produtosCompras pc
                LEFT JOIN produtos p ON p.codProd = pc.codProd
                WHERE pc.numero = @numero AND pc.serie = @serie
                  AND pc.modelo = @modelo AND pc.codForn = @codForn
                ORDER BY pc.codProd ASC;", con);
            AddKeyParams(cmd, numero, serie, modelo, codForn);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync()) list.Add(MapItem(rd));
            return list;
        }

        private static async Task InserirItemAsync(MySqlConnection con, MySqlTransaction tx, string numero, string serie, string modelo, int codForn, ProdutosCompras item)
        {
            await using var cmd = new MySqlCommand(@"
                INSERT INTO produtosCompras (numero, serie, modelo, codForn, codProd, quantidade,
                    valorUnitario, descontoPercentual, descontoValor, valorTotal, rateioFrete, rateioSeguro, rateioOutras, custoFinal,
                    quantidadeRecebida)
                VALUES (@numero, @serie, @modelo, @codForn, @codProd, @quantidade,
                    @valorUnitario, @descontoPercentual, @descontoValor, @valorTotal, @rateioFrete, @rateioSeguro, @rateioOutras, @custoFinal,
                    @quantidadeRecebida);", con, tx);
            AddKeyParams(cmd, numero, serie, modelo, codForn);
            cmd.Parameters.AddWithValue("@codProd", item.CodProd);
            cmd.Parameters.AddWithValue("@quantidade", item.Quantidade);
            cmd.Parameters.AddWithValue("@valorUnitario", item.ValorUnitario);
            cmd.Parameters.AddWithValue("@descontoPercentual", item.DescontoPercentual);
            cmd.Parameters.AddWithValue("@descontoValor", item.DescontoValor);
            cmd.Parameters.AddWithValue("@valorTotal", item.ValorTotal);
            cmd.Parameters.AddWithValue("@rateioFrete", item.RateioFrete);
            cmd.Parameters.AddWithValue("@rateioSeguro", item.RateioSeguro);
            cmd.Parameters.AddWithValue("@rateioOutras", item.RateioOutras);
            cmd.Parameters.AddWithValue("@custoFinal", item.CustoFinal);
            cmd.Parameters.AddWithValue("@quantidadeRecebida", item.QuantidadeRecebida);
            await cmd.ExecuteNonQueryAsync();
        }

        private static void AddKeyParams(MySqlCommand cmd, string numero, string serie, string modelo, int codForn)
        {
            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@codForn", codForn);
        }

        private static void AddParams(MySqlCommand cmd, Compras c)
        {
            AddKeyParams(cmd, c.Numero, c.Serie, c.Modelo, c.CodForn);
            cmd.Parameters.AddWithValue("@dataCompra", c.DataCompra);
            cmd.Parameters.AddWithValue("@dataPrevisaoEntrega", (object?)c.DataPrevisaoEntrega ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@codCondicao", (object?)c.CodCondicao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@valorProdutos", c.ValorProdutos);
            cmd.Parameters.AddWithValue("@valorDesconto", c.ValorDesconto);
            cmd.Parameters.AddWithValue("@valorFrete", c.ValorFrete);
            cmd.Parameters.AddWithValue("@valorSeguro", c.ValorSeguro);
            cmd.Parameters.AddWithValue("@outrasDespesas", c.OutrasDespesas);
            cmd.Parameters.AddWithValue("@valorTotal", c.ValorTotal);
            cmd.Parameters.AddWithValue("@observacoes", (object?)c.Observacoes ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@situacao", c.Situacao);
        }

        static Compras Map(MySqlDataReader rd) => new()
        {
            Numero = rd.GetString("numero"),
            Serie = rd.GetString("serie"),
            Modelo = rd.GetString("modelo"),
            CodForn = rd.GetInt32("codForn"),
            DataCompra = rd.GetDateTime("dataCompra"),
            DataPrevisaoEntrega = rd.IsDBNull(rd.GetOrdinal("dataPrevisaoEntrega")) ? null : rd.GetDateTime("dataPrevisaoEntrega"),
            CodCondicao = rd.IsDBNull(rd.GetOrdinal("codCondicao")) ? null : rd.GetInt32("codCondicao"),
            ValorProdutos = rd.GetDecimal("valorProdutos"),
            ValorDesconto = rd.GetDecimal("valorDesconto"),
            ValorFrete = rd.GetDecimal("valorFrete"),
            ValorSeguro = rd.GetDecimal("valorSeguro"),
            OutrasDespesas = rd.GetDecimal("outrasDespesas"),
            ValorTotal = rd.GetDecimal("valorTotal"),
            Observacoes = rd.IsDBNull(rd.GetOrdinal("observacoes")) ? null : rd.GetString("observacoes"),
            Situacao = rd.GetString("situacao"),
            Fornecedor = new Fornecedores
            {
                CodForn = rd.GetInt32("codForn"),
                Fornecedor = rd.IsDBNull(rd.GetOrdinal("FornecedorNome")) ? null : rd.GetString("FornecedorNome"),
                NomeFantasia = rd.IsDBNull(rd.GetOrdinal("FornecedorNomeFantasia")) ? null : rd.GetString("FornecedorNomeFantasia")
            },
            Condicao = rd.IsDBNull(rd.GetOrdinal("CondicaoNome")) ? null : new CondicaoPagamentos
            {
                CodCondicao = rd.GetInt32("codCondicao"),
                CondicaoPagamento = rd.GetString("CondicaoNome")
            }
        };

        static ProdutosCompras MapItem(MySqlDataReader rd) => new()
        {
            Numero = rd.GetString("numero"),
            Serie = rd.GetString("serie"),
            Modelo = rd.GetString("modelo"),
            CodForn = rd.GetInt32("codForn"),
            CodProd = rd.GetInt32("codProd"),
            Quantidade = rd.GetDecimal("quantidade"),
            ValorUnitario = rd.GetDecimal("valorUnitario"),
            DescontoPercentual = rd.GetDecimal("descontoPercentual"),
            DescontoValor = rd.GetDecimal("descontoValor"),
            ValorTotal = rd.GetDecimal("valorTotal"),
            RateioFrete = rd.IsDBNull(rd.GetOrdinal("rateioFrete")) ? 0 : rd.GetDecimal("rateioFrete"),
            RateioSeguro = rd.IsDBNull(rd.GetOrdinal("rateioSeguro")) ? 0 : rd.GetDecimal("rateioSeguro"),
            RateioOutras = rd.IsDBNull(rd.GetOrdinal("rateioOutras")) ? 0 : rd.GetDecimal("rateioOutras"),
            CustoFinal = rd.IsDBNull(rd.GetOrdinal("custoFinal")) ? 0 : rd.GetDecimal("custoFinal"),
            QuantidadeRecebida = rd.IsDBNull(rd.GetOrdinal("quantidadeRecebida")) ? 0 : rd.GetDecimal("quantidadeRecebida"),
            Produto = new Produtos
            {
                CodProd = rd.GetInt32("codProd"),
                Produto = rd.IsDBNull(rd.GetOrdinal("produto")) ? null : rd.GetString("produto"),
                Unidade = rd.IsDBNull(rd.GetOrdinal("unidade")) ? null : rd.GetString("unidade")
            }
        };
    }
}
