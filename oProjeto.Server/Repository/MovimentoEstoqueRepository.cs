using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class MovimentoEstoqueRepository(IConfiguration cfg)
    {
        private MySqlConnection Conn() =>
        new(cfg.GetConnectionString("DefaultConnection"));

    private const string SelectBase = @"
        SELECT m.*,
               p.CodProd, p.Produto, p.unidade AS ProdutoUnidade, p.Ativo AS ProdutoAtivo
        FROM movimentoEstoque m
        LEFT JOIN produtos p ON p.CodProd = m.codProd";


        public async Task<IEnumerable<MovimentosEstoque>> GetAllAsync()
        {
            var list = new List<MovimentosEstoque>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(
                $"{SelectBase} ORDER BY m.dataMovimento DESC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<IEnumerable<MovimentosEstoque>> GetByProdutoAsync(int codProd)
        {
            var list = new List<MovimentosEstoque>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(
                $"{SelectBase} WHERE m.codProd = @codProd ORDER BY m.dataMovimento", con);
            cmd.Parameters.AddWithValue("@codProd", codProd);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<IEnumerable<MovimentosEstoque>> GetByNotaEntradaAsync(
            int numero, int modelo, int serie, int codForn)
        {
            var list = new List<MovimentosEstoque>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand($@"{SelectBase}
            WHERE m.tipo = 'ENTRADA'
              AND m.numero = @numero AND m.modelo = @modelo
              AND m.serie = @serie AND m.codParceiro = @codForn
            ORDER BY m.codProd", con);
            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@codForn", codForn);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<IEnumerable<MovimentosEstoque>> GetByNotaSaidaAsync(
            int numero, int modelo, int serie, int codCliente)
        {
            var list = new List<MovimentosEstoque>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand($@"{SelectBase}
            WHERE m.tipo = 'SAIDA'
              AND m.numero = @numero AND m.modelo = @modelo
              AND m.serie = @serie AND m.codParceiro = @codCliente
            ORDER BY m.codProd", con);
            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@codCliente", codCliente);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        // Registro de entrada
        public static async Task RegistrarEntradaAsync(
            MySqlConnection con, MySqlTransaction tx,
            int numero, int modelo, int serie, int codForn,
            int codProd, decimal quantidade, decimal custoUnitario, string? observacao = null)
        {
            if (quantidade <= 0)
                throw new InvalidOperationException(
                    $"A quantidade do produto {codProd} deve ser maior que zero.");

            if (custoUnitario <= 0)
                throw new InvalidOperationException(
                    $"O custo do produto {codProd} deve ser maior que zero.");

            var (saldoAnterior, custoMedioAnterior) =
                await BloquearProdutoAsync(con, tx, codProd);

            var saldoPosterior = saldoAnterior + quantidade;

            var custoMedioPosterior = saldoPosterior <= 0
                ? custoUnitario
                : Math.Round(
                    (saldoAnterior * custoMedioAnterior +
                     quantidade * custoUnitario) / saldoPosterior,
                    4,
                    MidpointRounding.AwayFromZero);

            var mov = new MovimentosEstoque
            {
                Tipo = "ENTRADA",
                Numero = numero,
                Modelo = modelo,
                Serie = serie,
                CodParceiro = codForn,
                CodProd = codProd,
                Quantidade = quantidade,
                CustoUnitario = custoUnitario,
                ValorTotal = Math.Round(
                    quantidade * custoUnitario,
                    2,
                    MidpointRounding.AwayFromZero),
                SaldoAnterior = saldoAnterior,
                SaldoPosterior = saldoPosterior,
                CustoMedioAnterior = custoMedioAnterior,
                CustoMedioPosterior = custoMedioPosterior,
                Observacao = observacao
            };

            await InserirAsync(
                con,
                tx,
                "movimentoEstoqueEntrada",
                "codForn",
                mov);

            await AtualizarProdutoAsync(
                con,
                tx,
                codProd,
                saldoPosterior,
                custoMedioPosterior);
        }

        // Registro de saída
        public static async Task RegistrarSaidaAsync(
            MySqlConnection con, MySqlTransaction tx,
            int numero, int modelo, int serie, int codCliente,
            int codProd, decimal quantidade, string? observacao = null)
        {
            if (quantidade <= 0)
                throw new InvalidOperationException(
                    $"A quantidade do produto {codProd} deve ser maior que zero.");

            var (saldoAnterior, custoMedioAnterior) =
                await BloquearProdutoAsync(con, tx, codProd);

            if (quantidade > saldoAnterior)
                throw new InvalidOperationException(
                    $"Saldo insuficiente do produto {codProd}: disponível {saldoAnterior}, solicitado {quantidade}.");

            var saldoPosterior = saldoAnterior - quantidade;

            var mov = new MovimentosEstoque
            {
                Tipo = "SAIDA",
                Numero = numero,
                Modelo = modelo,
                Serie = serie,
                CodParceiro = codCliente,
                CodProd = codProd,
                Quantidade = quantidade,
                CustoUnitario = custoMedioAnterior,
                ValorTotal = Math.Round(
                    quantidade * custoMedioAnterior,
                    2,
                    MidpointRounding.AwayFromZero),
                SaldoAnterior = saldoAnterior,
                SaldoPosterior = saldoPosterior,
                CustoMedioAnterior = custoMedioAnterior,
                CustoMedioPosterior = custoMedioAnterior,
                Observacao = observacao
            };

            await InserirAsync(
                con,
                tx,
                "movimentoEstoqueSaida",
                "codCliente",
                mov);

            await AtualizarProdutoAsync(
                con,
                tx,
                codProd,
                saldoPosterior,
                custoMedioAnterior);
        }


        public static Task RemoverEntradaAsync(
            MySqlConnection con, MySqlTransaction tx,
            int numero, int modelo, int serie, int codForn) =>
            DesfazerAsync(
                con,
                tx,
                "movimentoEstoqueEntrada",
                "codForn",
                numero,
                modelo,
                serie,
                codForn);

        public static Task RemoverSaidaAsync(
            MySqlConnection con, MySqlTransaction tx,
            int numero, int modelo, int serie, int codCliente) =>
            DesfazerAsync(
                con,
                tx,
                "movimentoEstoqueSaida",
                "codCliente",
                numero,
                modelo,
                serie,
                codCliente);

        private static async Task<(decimal Saldo, decimal CustoMedio)> BloquearProdutoAsync(
            MySqlConnection con, MySqlTransaction tx, int codProd)
        {
            await using var cmd = new MySqlCommand(
                "SELECT saldo, custoMedio FROM produtos WHERE codProd = @codProd FOR UPDATE",
                con, tx);

            cmd.Parameters.AddWithValue("@codProd", codProd);

            await using var rd = await cmd.ExecuteReaderAsync();

            if (!await rd.ReadAsync())
                throw new InvalidOperationException(
                    $"Produto {codProd} não encontrado.");

            return (
                rd.IsDBNull(rd.GetOrdinal("saldo"))
                    ? 0
                    : rd.GetDecimal(rd.GetOrdinal("saldo")),

                rd.IsDBNull(rd.GetOrdinal("custoMedio"))
                    ? 0
                    : rd.GetDecimal(rd.GetOrdinal("custoMedio")));
        }

        private static async Task AtualizarProdutoAsync(
            MySqlConnection con, MySqlTransaction tx,
            int codProd, decimal saldo, decimal custoMedio)
        {
            await using var cmd = new MySqlCommand(@"
            UPDATE produtos
            SET saldo = @saldo,
                custoMedio = @custoMedio
            WHERE codProd = @codProd", con, tx);

            cmd.Parameters.AddWithValue("@saldo", saldo);
            cmd.Parameters.AddWithValue("@custoMedio", custoMedio);
            cmd.Parameters.AddWithValue("@codProd", codProd);

            await cmd.ExecuteNonQueryAsync();
        }

        private static async Task InserirAsync(
            MySqlConnection con, MySqlTransaction tx,
            string tabela, string colParceiro, MovimentosEstoque m)
        {
            await using var cmd = new MySqlCommand($@"
            INSERT INTO {tabela}
                (numero, modelo, serie, {colParceiro}, codProd, quantidade, custoUnitario, valorTotal,
                 saldoAnterior, saldoPosterior, custoMedioAnterior, custoMedioPosterior, observacao)
            VALUES
                (@numero, @modelo, @serie, @codParceiro, @codProd, @quantidade, @custoUnitario, @valorTotal,
                 @saldoAnterior, @saldoPosterior, @custoMedioAnterior, @custoMedioPosterior, @observacao)",
                con, tx);

            cmd.Parameters.AddWithValue("@numero", m.Numero);
            cmd.Parameters.AddWithValue("@modelo", m.Modelo);
            cmd.Parameters.AddWithValue("@serie", m.Serie);
            cmd.Parameters.AddWithValue("@codParceiro", m.CodParceiro);
            cmd.Parameters.AddWithValue("@codProd", m.CodProd);
            cmd.Parameters.AddWithValue("@quantidade", m.Quantidade);
            cmd.Parameters.AddWithValue("@custoUnitario", m.CustoUnitario);
            cmd.Parameters.AddWithValue("@valorTotal", m.ValorTotal);
            cmd.Parameters.AddWithValue("@saldoAnterior", m.SaldoAnterior);
            cmd.Parameters.AddWithValue("@saldoPosterior", m.SaldoPosterior);
            cmd.Parameters.AddWithValue("@custoMedioAnterior", m.CustoMedioAnterior);
            cmd.Parameters.AddWithValue("@custoMedioPosterior", m.CustoMedioPosterior);
            cmd.Parameters.AddWithValue(
                "@observacao",
                (object?)m.Observacao ?? DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
        }

        private static async Task DesfazerAsync(
            MySqlConnection con, MySqlTransaction tx,
            string tabela, string colParceiro,
            int numero, int modelo, int serie, int codParceiro)
        {
            var movimentos =
                new List<(int CodProd, DateTime Data, decimal SaldoAnterior, decimal CustoMedioAnterior)>();

            await using (var cmd = new MySqlCommand($@"
            SELECT codProd, dataMovimento, saldoAnterior, custoMedioAnterior
            FROM {tabela}
            WHERE numero = @numero
              AND modelo = @modelo
              AND serie = @serie
              AND {colParceiro} = @codParceiro", con, tx))
            {
                cmd.Parameters.AddWithValue("@numero", numero);
                cmd.Parameters.AddWithValue("@modelo", modelo);
                cmd.Parameters.AddWithValue("@serie", serie);
                cmd.Parameters.AddWithValue("@codParceiro", codParceiro);

                await using var rd = await cmd.ExecuteReaderAsync();

                while (await rd.ReadAsync())
                {
                    movimentos.Add((
                        rd.GetInt32("codProd"),
                        rd.GetDateTime("dataMovimento"),
                        rd.GetDecimal("saldoAnterior"),
                        rd.GetDecimal("custoMedioAnterior")));
                }
            }

            foreach (var mov in movimentos)
            {
                await BloquearProdutoAsync(
                    con,
                    tx,
                    mov.CodProd);

                await using (var chk = new MySqlCommand(@"
                SELECT COUNT(*)
                FROM movimentoEstoque
                WHERE codProd = @codProd
                  AND dataMovimento > @data", con, tx))
                {
                    chk.Parameters.AddWithValue("@codProd", mov.CodProd);
                    chk.Parameters.AddWithValue("@data", mov.Data);

                    if (Convert.ToInt32(await chk.ExecuteScalarAsync()) > 0)
                        throw new InvalidOperationException(
                            $"Não é possível desfazer o estoque do produto {mov.CodProd}: " +
                            "há movimentações posteriores. Utilize uma nota de devolução.");
                }

                await AtualizarProdutoAsync(
                    con,
                    tx,
                    mov.CodProd,
                    mov.SaldoAnterior,
                    mov.CustoMedioAnterior);

                await using var del = new MySqlCommand($@"
                DELETE FROM {tabela}
                WHERE numero = @numero
                  AND modelo = @modelo
                  AND serie = @serie
                  AND {colParceiro} = @codParceiro
                  AND codProd = @codProd",
                    con, tx);

                del.Parameters.AddWithValue("@numero", numero);
                del.Parameters.AddWithValue("@modelo", modelo);
                del.Parameters.AddWithValue("@serie", serie);
                del.Parameters.AddWithValue("@codParceiro", codParceiro);
                del.Parameters.AddWithValue("@codProd", mov.CodProd);

                await del.ExecuteNonQueryAsync();
            }
        }

        static MovimentosEstoque Map(MySqlDataReader rd) => new()
        {
            Tipo = rd.GetString("tipo"),
            Numero = rd.GetInt32("numero"),
            Modelo = rd.GetInt32("modelo"),
            Serie = rd.GetInt32("serie"),
            CodParceiro = rd.GetInt32("codParceiro"),
            CodProd = rd.GetInt32("codProd"),
            Quantidade = rd.GetDecimal("quantidade"),
            CustoUnitario = rd.GetDecimal("custoUnitario"),
            ValorTotal = rd.GetDecimal("valorTotal"),
            SaldoAnterior = rd.GetDecimal("saldoAnterior"),
            SaldoPosterior = rd.GetDecimal("saldoPosterior"),
            CustoMedioAnterior = rd.GetDecimal("custoMedioAnterior"),
            CustoMedioPosterior = rd.GetDecimal("custoMedioPosterior"),
            DataMovimento = rd.GetDateTime("dataMovimento"),
            Observacao = rd.IsDBNull(rd.GetOrdinal("observacao"))
                ? null
                : rd.GetString("observacao"),

            Produto = rd.IsDBNull(rd.GetOrdinal("Produto"))
                ? null
                : new Produtos
                {
                    CodProd = rd.GetInt32("CodProd"),
                    Produto = rd.GetString("Produto"),
                    Unidade = rd.IsDBNull(rd.GetOrdinal("ProdutoUnidade"))
                        ? null
                        : rd.GetString("ProdutoUnidade"),
                    Ativo = !rd.IsDBNull(rd.GetOrdinal("ProdutoAtivo"))
                        && rd.GetBoolean("ProdutoAtivo"),
                }
        };
    }

}
