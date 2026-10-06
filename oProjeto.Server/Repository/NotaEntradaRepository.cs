using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class NotaEntradaRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));


        private const string SelectBase = @"
            SELECT n.*,
                   f.CodForn, f.Fornecedor, f.Ativo AS FornecedorAtivo,
                   cp.CodCondicao, cp.CondicaoPagamento AS CondicaoDescricao,
                   t.CodTransp, t.Transportador, t.Ativo AS TransportadorAtivo
            FROM notasEntrada n
            LEFT JOIN fornecedores f ON f.CodForn = n.codForn
            LEFT JOIN condicaopagamentos cp ON cp.CodCondicao = n.codCondicao
            LEFT JOIN transportadores t ON t.CodTransp = n.codTransp";

        private const string SelectItens = @"
            SELECT pi.*,
                   p.CodProd, p.Produto, p.unidade AS ProdutoUnidade, p.Ativo AS ProdutoAtivo
            FROM produtosNotaEntrada pi
            LEFT JOIN produtos p ON p.CodProd = pi.codProd
            WHERE pi.numero = @numero AND pi.modelo = @modelo
              AND pi.serie = @serie AND pi.codForn = @codForn";

        public async Task<IEnumerable<NotasEntradas>> GetAllAsync()
        {
            var list = new List<NotasEntradas>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(
                $"{SelectBase} ORDER BY n.numero, n.modelo, n.serie, n.codForn", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<IEnumerable<NotasEntradas>> GetByFornecedorAsync(int codForn)
        {
            var list = new List<NotasEntradas>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand($"{SelectBase} WHERE n.codForn = @codForn", con);
            cmd.Parameters.AddWithValue("@codForn", codForn);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<NotasEntradas?> GetByIdAsync(string numero, string modelo, string serie, int codForn)
        {
            await using var con = Conn();
            await con.OpenAsync();

            NotasEntradas? nota;
            await using (var cmd = new MySqlCommand($@"{SelectBase}
                WHERE n.numero = @numero AND n.modelo = @modelo
                  AND n.serie = @serie AND n.codForn = @codForn", con))
            {
                cmd.Parameters.AddWithValue("@numero", numero);
                cmd.Parameters.AddWithValue("@modelo", modelo);
                cmd.Parameters.AddWithValue("@serie", serie);
                cmd.Parameters.AddWithValue("@codForn", codForn);
                await using var rd = await cmd.ExecuteReaderAsync();
                nota = await rd.ReadAsync() ? Map(rd) : null;
            }

            if (nota is null)
                return null;

            nota.Produtos = (await GetItensAsync(con, numero, modelo, serie, codForn)).ToList();
            return nota;
        }

        private static async Task<IEnumerable<ProdutosNotaEntrada>> GetItensAsync(
            MySqlConnection con, string numero, string modelo, string serie, int codForn)
        {
            var list = new List<ProdutosNotaEntrada>();
            await using var cmd = new MySqlCommand(SelectItens, con);
            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@codForn", codForn);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(MapItem(rd));
            return list;
        }

        public async Task<NotasEntradas> CreateAsync(NotasEntradas body)
        {
            body.Situacao = "PENDENTE";

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                await using (var cmd = new MySqlCommand(@"
                    INSERT INTO notasEntrada
                        (numero, serie, modelo, codForn, dataEmissao, dataChegada, tipoFrete,
                         valorProdutos, valorFrete, valorSeguro, outrasDespesas, valorDesconto,
                         valorTotal, codCondicao, codTransp, placaVeiculo, observacoes, situacao,
                         pedidoNumero, pedidoSerie, pedidoModelo)
                    VALUES
                        (@numero, @serie, @modelo, @codForn, @dataEmissao, @dataChegada, @tipoFrete,
                         @valorProdutos, @valorFrete, @valorSeguro, @outrasDespesas, @valorDesconto,
                         @valorTotal, @codCondicao, @codTransp, @placaVeiculo, @observacoes, @situacao,
                         @pedidoNumero, @pedidoSerie, @pedidoModelo)",
                    con, tx))
                {
                    AddParams(cmd, body);
                    await cmd.ExecuteNonQueryAsync();
                }

                foreach (var item in body.Produtos)
                    await InserirItemAsync(con, tx, body.Numero, body.Modelo, body.Serie, body.CodForn, item);

                if (!string.IsNullOrWhiteSpace(body.PedidoNumero) &&
                    !string.IsNullOrWhiteSpace(body.PedidoSerie) &&
                    !string.IsNullOrWhiteSpace(body.PedidoModelo))
                {
                    await AtualizarRecebimentoPedidoAsync(con, tx,
                        body.PedidoNumero, body.PedidoSerie, body.PedidoModelo,
                        body.CodForn, body.Produtos);
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            var descVinculo = !string.IsNullOrWhiteSpace(body.PedidoNumero)
                ? $" - Vinculada ao Pedido {body.PedidoNumero}/{body.PedidoSerie} (Modelo {body.PedidoModelo})"
                : "";

            await log.AddAsync("NotasEntrada", "CRIOU",
                $"Criou Nota de Entrada: Nº {body.Numero}/{body.Serie} (Modelo {body.Modelo}) - " +
                $"Fornecedor {body.CodForn} com {body.Produtos.Count} item(ns){descVinculo}");

            return body;
        }

        public async Task UpdateAsync(NotasEntradas body)
        {
            var antes = await GetByIdAsync(body.Numero, body.Modelo, body.Serie, body.CodForn);

            if (antes is null)
                throw new InvalidOperationException("Nota de entrada não encontrada.");

            if (!string.Equals(antes.Situacao, "PENDENTE", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    $"A nota está com situação {antes.Situacao} e não pode mais ser editada.");

            body.Situacao = "PENDENTE";

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                await using (var cmd = new MySqlCommand(@"
                    UPDATE notasEntrada SET
                        dataEmissao = @dataEmissao,
                        dataChegada = @dataChegada,
                        tipoFrete = @tipoFrete,
                        valorProdutos = @valorProdutos,
                        valorFrete = @valorFrete,
                        valorSeguro = @valorSeguro,
                        outrasDespesas = @outrasDespesas,
                        valorDesconto = @valorDesconto,
                        valorTotal = @valorTotal,
                        codCondicao = @codCondicao,
                        codTransp = @codTransp,
                        placaVeiculo = @placaVeiculo,
                        observacoes = @observacoes,
                        situacao = @situacao,
                        pedidoNumero = @pedidoNumero,
                        pedidoSerie = @pedidoSerie,
                        pedidoModelo = @pedidoModelo
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codForn = @codForn",
                    con, tx))
                {
                    AddParams(cmd, body);
                    await cmd.ExecuteNonQueryAsync();
                }

                if (!string.IsNullOrWhiteSpace(antes.PedidoNumero) &&
                    !string.IsNullOrWhiteSpace(antes.PedidoSerie) &&
                    !string.IsNullOrWhiteSpace(antes.PedidoModelo))
                {
                    await ReverterRecebimentoPedidoAsync(con, tx,
                        antes.PedidoNumero, antes.PedidoSerie, antes.PedidoModelo,
                        antes.CodForn, antes.Produtos);
                }

                await using (var delCmd = new MySqlCommand(@"
                    DELETE FROM produtosNotaEntrada
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codForn = @codForn", con, tx))
                {
                    delCmd.Parameters.AddWithValue("@numero", body.Numero);
                    delCmd.Parameters.AddWithValue("@modelo", body.Modelo);
                    delCmd.Parameters.AddWithValue("@serie", body.Serie);
                    delCmd.Parameters.AddWithValue("@codForn", body.CodForn);
                    await delCmd.ExecuteNonQueryAsync();
                }

                foreach (var item in body.Produtos)
                    await InserirItemAsync(con, tx, body.Numero, body.Modelo, body.Serie, body.CodForn, item);

                if (!string.IsNullOrWhiteSpace(body.PedidoNumero) &&
                    !string.IsNullOrWhiteSpace(body.PedidoSerie) &&
                    !string.IsNullOrWhiteSpace(body.PedidoModelo))
                {
                    await AtualizarRecebimentoPedidoAsync(con, tx,
                        body.PedidoNumero, body.PedidoSerie, body.PedidoModelo,
                        body.CodForn, body.Produtos);
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            var mudancas = new List<string>();

            if (antes?.Situacao != body.Situacao)
                mudancas.Add($"Situação: {body.Situacao} (Era {antes?.Situacao})");

            if (antes?.ValorTotal != body.ValorTotal)
                mudancas.Add($"Valor Total: {body.ValorTotal:C} (Era {antes?.ValorTotal:C})");

            if (antes?.DataChegada != body.DataChegada)
                mudancas.Add($"Data Chegada: {body.DataChegada:d} (Era {antes?.DataChegada:d})");

            if (antes?.CodTransp != body.CodTransp)
                mudancas.Add($"Transportadora: {body.CodTransp} (Era {antes?.CodTransp})");

            if (antes?.CodCondicao != body.CodCondicao)
                mudancas.Add($"Condição Pagamento: {body.CodCondicao} (Era {antes?.CodCondicao})");

            if (antes?.Produtos.Count != body.Produtos.Count)
                mudancas.Add($"Itens: {body.Produtos.Count} (Era {antes?.Produtos.Count})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";

            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Nota de Entrada: Nº {body.Numero}/{body.Serie}"
                : $"Editou Nota de Entrada: Nº {body.Numero}/{body.Serie}. {diff}";

            await log.AddAsync("NotasEntrada", "EDITOU", desc);
        }

        public async Task ConfirmarAsync(string numero, string modelo, string serie, int codForn)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                string situacao;

                await using (var cmd = new MySqlCommand(@"
                    SELECT situacao
                    FROM notasEntrada
                    WHERE numero = @numero
                      AND modelo = @modelo
                      AND serie = @serie
                      AND codForn = @codForn
                    FOR UPDATE", con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codForn", codForn);

                    var result = await cmd.ExecuteScalarAsync();

                    if (result is null)
                        throw new InvalidOperationException("Nota de entrada não encontrada.");

                    situacao = result.ToString() ?? "";
                }

                if (!string.Equals(situacao, "PENDENTE", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException(
                        $"A nota não pode ser confirmada porque está com situação {situacao}.");

                var itens = new List<ProdutosNotaEntrada>();

                await using (var cmd = new MySqlCommand(SelectItens, con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codForn", codForn);

                    await using var rd = await cmd.ExecuteReaderAsync();

                    while (await rd.ReadAsync())
                        itens.Add(MapItem(rd));
                }

                if (itens.Count == 0)
                    throw new InvalidOperationException(
                        "A nota não pode ser confirmada porque não possui produtos.");

                int? codCondicao;
                decimal valorTotal;
                DateTime dataEmissao;

                await using (var cmd = new MySqlCommand(@"
                    SELECT codCondicao, valorTotal, dataEmissao
                    FROM notasEntrada
                    WHERE numero = @numero
                      AND modelo = @modelo
                      AND serie = @serie
                      AND codForn = @codForn", con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codForn", codForn);

                    await using var rd = await cmd.ExecuteReaderAsync();

                    if (!await rd.ReadAsync())
                        throw new InvalidOperationException("Nota de entrada não encontrada.");

                    codCondicao = rd.IsDBNull(rd.GetOrdinal("codCondicao"))
                        ? null
                        : rd.GetInt32(rd.GetOrdinal("codCondicao"));
                    valorTotal = rd.GetDecimal(rd.GetOrdinal("valorTotal"));
                    dataEmissao = rd.GetDateTime(rd.GetOrdinal("dataEmissao"));
                }

                foreach (var item in itens)
                {
                    if (item.Quantidade <= 0)
                        throw new InvalidOperationException(
                            $"A quantidade do produto {item.CodProd} deve ser maior que zero.");

                    var custoUnitario = item.CustoFinal > 0
                        ? item.CustoFinal
                        : item.ValorUnitario;

                    if (custoUnitario <= 0)
                        throw new InvalidOperationException(
                            $"O custo do produto {item.CodProd} deve ser maior que zero.");

                    await MovimentoEstoqueRepository.RegistrarEntradaAsync(
                        con,
                        tx,
                        numero,
                        modelo,
                        serie,
                        codForn,
                        item.CodProd,
                        item.Quantidade,
                        custoUnitario,
                        $"Entrada da Nota {numero}/{serie} - Fornecedor {codForn}");
                }

                await ContaPagarRepository.GerarContasDaNotaAsync(
                    con,
                    tx,
                    numero,
                    modelo,
                    serie,
                    codForn,
                    codCondicao,
                    valorTotal,
                    dataEmissao);

                await using (var cmd = new MySqlCommand(@"
                    UPDATE notasEntrada
                    SET situacao = 'CONFERIDA',
                        dataChegada = COALESCE(dataChegada, CURRENT_DATE)
                    WHERE numero = @numero
                      AND modelo = @modelo
                      AND serie = @serie
                      AND codForn = @codForn
                      AND situacao = 'PENDENTE'", con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codForn", codForn);

                    var alteradas = await cmd.ExecuteNonQueryAsync();

                    if (alteradas != 1)
                        throw new InvalidOperationException(
                            "Não foi possível confirmar a nota de entrada.");
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync("NotasEntrada", "CONFIRMOU",
                $"Conferiu Nota de Entrada: Nº {numero}/{serie} (Modelo {modelo}) - Fornecedor {codForn}");
        }

        public async Task DeleteAsync(string numero, string modelo, string serie, int codForn)
        {
            var nota = await GetByIdAsync(numero, modelo, serie, codForn);

            if (nota is null)
                throw new InvalidOperationException("Nota de entrada não encontrada.");

            if (!string.Equals(nota.Situacao, "PENDENTE", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    $"A nota está com situação {nota.Situacao} e não pode ser excluída.");

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                if (!string.IsNullOrWhiteSpace(nota.PedidoNumero) &&
                    !string.IsNullOrWhiteSpace(nota.PedidoSerie) &&
                    !string.IsNullOrWhiteSpace(nota.PedidoModelo))
                {
                    await ReverterRecebimentoPedidoAsync(con, tx,
                        nota.PedidoNumero, nota.PedidoSerie, nota.PedidoModelo,
                        nota.CodForn, nota.Produtos);
                }

                await using (var cmd = new MySqlCommand(@"
                    DELETE FROM notasEntrada
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codForn = @codForn", con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codForn", codForn);
                    await cmd.ExecuteNonQueryAsync();
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync("NotasEntrada", "EXCLUIU",
                $"Excluiu Nota de Entrada: Nº {numero}/{serie} (Modelo {modelo}) - Fornecedor {codForn}");
        }

        // Cancela a nota desfazendo seus efeitos, tudo na mesma transação:
        //  - CONFERIDA: cancela contas a pagar (bloqueia se houver paga) e restaura estoque/custo médio
        //  - PENDENTE e CONFERIDA: desfaz o recebimento no pedido de compra vinculado
        public async Task CancelarAsync(string numero, string modelo, string serie, int codForn, string motivo)
        {
            if (string.IsNullOrWhiteSpace(motivo))
                throw new InvalidOperationException("O motivo do cancelamento é obrigatório.");

            var nota = await GetByIdAsync(numero, modelo, serie, codForn)
                ?? throw new InvalidOperationException("Nota de entrada não encontrada.");

            await using var con = Conn();
            await con.OpenAsync();
            await using var tx = await con.BeginTransactionAsync();

            try
            {
                string situacao;
                await using (var cmd = new MySqlCommand(@"
                    SELECT situacao FROM notasEntrada
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codForn = @codForn
                    FOR UPDATE", con, tx))
                {
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codForn", codForn);
                    situacao = (await cmd.ExecuteScalarAsync())?.ToString()
                        ?? throw new InvalidOperationException("Nota de entrada não encontrada.");
                }

                if (situacao.Equals("CANCELADA", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("A nota de entrada já está cancelada.");

                if (situacao.Equals("CONFERIDA", StringComparison.OrdinalIgnoreCase))
                {
                    // Contas a pagar: bloqueia se alguma já foi paga, senão cancela
                    await ContaPagarRepository.CancelarContasDaNotaAsync(
                        con, tx, numero, modelo, serie, codForn);

                    // Estoque: restaura saldo e custo médio anteriores
                    await MovimentoEstoqueRepository.RemoverEntradaAsync(
                        con, tx, numero, modelo, serie, codForn);
                }

                // Pedido de compra: desfaz o recebimento (PENDENTE e CONFERIDA)
                if (!string.IsNullOrWhiteSpace(nota.PedidoNumero) &&
                    !string.IsNullOrWhiteSpace(nota.PedidoSerie) &&
                    !string.IsNullOrWhiteSpace(nota.PedidoModelo))
                {
                    await ReverterRecebimentoPedidoAsync(con, tx,
                        nota.PedidoNumero, nota.PedidoSerie, nota.PedidoModelo,
                        nota.CodForn, nota.Produtos);
                }

                // Marca a nota como cancelada
                await using (var cmd = new MySqlCommand(@"
                    UPDATE notasEntrada
                    SET situacao = 'CANCELADA',
                        motivoCancelamento = @motivo
                    WHERE numero = @numero AND modelo = @modelo
                      AND serie = @serie AND codForn = @codForn
                      AND situacao = @situacaoAtual", con, tx))
                {
                    cmd.Parameters.AddWithValue("@motivo", motivo.Trim());
                    cmd.Parameters.AddWithValue("@situacaoAtual", situacao);
                    cmd.Parameters.AddWithValue("@numero", numero);
                    cmd.Parameters.AddWithValue("@modelo", modelo);
                    cmd.Parameters.AddWithValue("@serie", serie);
                    cmd.Parameters.AddWithValue("@codForn", codForn);

                    if (await cmd.ExecuteNonQueryAsync() != 1)
                        throw new InvalidOperationException(
                            $"Não foi possível cancelar a nota de entrada. Situação atual: {situacao}.");
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await log.AddAsync("NotasEntrada", "CANCELOU",
                $"Cancelou Nota de Entrada: Nº {numero}/{serie} (Modelo {modelo}) - " +
                $"Fornecedor {codForn}. Motivo: {motivo.Trim()}");
        }

        private static async Task AtualizarRecebimentoPedidoAsync(
            MySqlConnection con, MySqlTransaction tx,
            string pedidoNumero, string pedidoSerie, string pedidoModelo, int codForn,
            List<ProdutosNotaEntrada> itensRecebidos)
        {
            foreach (var item in itensRecebidos)
            {
                await using var cmd = new MySqlCommand(@"
                    UPDATE produtosCompras
                    SET quantidadeRecebida = quantidadeRecebida + @qtd
                    WHERE numero = @numero AND serie = @serie
                      AND modelo = @modelo AND codForn = @codForn AND codProd = @codProd",
                    con, tx);

                cmd.Parameters.AddWithValue("@qtd", item.Quantidade);
                cmd.Parameters.AddWithValue("@numero", pedidoNumero);
                cmd.Parameters.AddWithValue("@serie", pedidoSerie);
                cmd.Parameters.AddWithValue("@modelo", pedidoModelo);
                cmd.Parameters.AddWithValue("@codForn", codForn);
                cmd.Parameters.AddWithValue("@codProd", item.CodProd);
                await cmd.ExecuteNonQueryAsync();
            }

            await RecalcularSituacaoPedidoAsync(con, tx, pedidoNumero, pedidoSerie, pedidoModelo, codForn);
        }

        private static async Task ReverterRecebimentoPedidoAsync(
            MySqlConnection con, MySqlTransaction tx,
            string pedidoNumero, string pedidoSerie, string pedidoModelo, int codForn,
            List<ProdutosNotaEntrada> itensRecebidosAnteriormente)
        {
            foreach (var item in itensRecebidosAnteriormente)
            {
                await using var cmd = new MySqlCommand(@"
                    UPDATE produtosCompras
                    SET quantidadeRecebida = GREATEST(quantidadeRecebida - @qtd, 0)
                    WHERE numero = @numero AND serie = @serie
                      AND modelo = @modelo AND codForn = @codForn AND codProd = @codProd",
                    con, tx);

                cmd.Parameters.AddWithValue("@qtd", item.Quantidade);
                cmd.Parameters.AddWithValue("@numero", pedidoNumero);
                cmd.Parameters.AddWithValue("@serie", pedidoSerie);
                cmd.Parameters.AddWithValue("@modelo", pedidoModelo);
                cmd.Parameters.AddWithValue("@codForn", codForn);
                cmd.Parameters.AddWithValue("@codProd", item.CodProd);
                await cmd.ExecuteNonQueryAsync();
            }

            await RecalcularSituacaoPedidoAsync(con, tx, pedidoNumero, pedidoSerie, pedidoModelo, codForn);
        }

        private static async Task RecalcularSituacaoPedidoAsync(
            MySqlConnection con, MySqlTransaction tx,
            string pedidoNumero, string pedidoSerie, string pedidoModelo, int codForn)
        {
            await using var checkCmd = new MySqlCommand(@"
                SELECT
                    SUM(CASE WHEN quantidadeRecebida >= quantidade THEN 1 ELSE 0 END) AS completos,
                    COUNT(*) AS total,
                    SUM(CASE WHEN quantidadeRecebida > 0 THEN 1 ELSE 0 END) AS comAlgo
                FROM produtosCompras
                WHERE numero = @numero AND serie = @serie
                  AND modelo = @modelo AND codForn = @codForn",
                con, tx);

            checkCmd.Parameters.AddWithValue("@numero", pedidoNumero);
            checkCmd.Parameters.AddWithValue("@serie", pedidoSerie);
            checkCmd.Parameters.AddWithValue("@modelo", pedidoModelo);
            checkCmd.Parameters.AddWithValue("@codForn", codForn);

            int completos, total, comAlgo;
            await using (var rd = await checkCmd.ExecuteReaderAsync())
            {
                await rd.ReadAsync();
                completos = rd.IsDBNull(rd.GetOrdinal("completos")) ? 0 : Convert.ToInt32(rd["completos"]);
                total = Convert.ToInt32(rd["total"]);
                comAlgo = rd.IsDBNull(rd.GetOrdinal("comAlgo")) ? 0 : Convert.ToInt32(rd["comAlgo"]);
            }

            if (total == 0) return;

            var novaSituacao = completos == total ? "CONCLUIDA" : comAlgo > 0 ? "PARCIAL" : "ABERTA";

            await using var updCmd = new MySqlCommand(@"
                UPDATE compras SET situacao = @situacao
                WHERE numero = @numero AND serie = @serie
                  AND modelo = @modelo AND codForn = @codForn",
                con, tx);

            updCmd.Parameters.AddWithValue("@situacao", novaSituacao);
            updCmd.Parameters.AddWithValue("@numero", pedidoNumero);
            updCmd.Parameters.AddWithValue("@serie", pedidoSerie);
            updCmd.Parameters.AddWithValue("@modelo", pedidoModelo);
            updCmd.Parameters.AddWithValue("@codForn", codForn);
            await updCmd.ExecuteNonQueryAsync();
        }

        private static async Task InserirItemAsync(
            MySqlConnection con, MySqlTransaction tx,
            string numero, string modelo, string serie, int codForn, ProdutosNotaEntrada item)
        {
            await using var cmd = new MySqlCommand(@"
                INSERT INTO produtosNotaEntrada
                    (numero, modelo, serie, codForn, codProd, quantidade, valorUnitario, valorTotal,
                     descontoPercentual, descontoValor, rateioFrete, rateioSeguro, rateioOutras, custoFinal)
                VALUES
                    (@numero, @modelo, @serie, @codForn, @codProd, @quantidade, @valorUnitario, @valorTotal,
                     @descontoPercentual, @descontoValor, @rateioFrete, @rateioSeguro, @rateioOutras, @custoFinal)",
                con, tx);

            cmd.Parameters.AddWithValue("@numero", numero);
            cmd.Parameters.AddWithValue("@modelo", modelo);
            cmd.Parameters.AddWithValue("@serie", serie);
            cmd.Parameters.AddWithValue("@codForn", codForn);
            cmd.Parameters.AddWithValue("@codProd", item.CodProd);
            cmd.Parameters.AddWithValue("@quantidade", item.Quantidade);
            cmd.Parameters.AddWithValue("@valorUnitario", item.ValorUnitario);
            cmd.Parameters.AddWithValue("@valorTotal", item.ValorTotal);
            cmd.Parameters.AddWithValue("@descontoPercentual", item.DescontoPercentual);
            cmd.Parameters.AddWithValue("@descontoValor", item.DescontoValor);
            cmd.Parameters.AddWithValue("@rateioFrete", item.RateioFrete);
            cmd.Parameters.AddWithValue("@rateioSeguro", item.RateioSeguro);
            cmd.Parameters.AddWithValue("@rateioOutras", item.RateioOutras);
            cmd.Parameters.AddWithValue("@custoFinal", item.CustoFinal);

            await cmd.ExecuteNonQueryAsync();
        }

        private static void AddParams(MySqlCommand cmd, NotasEntradas n)
        {
            cmd.Parameters.AddWithValue("@numero", n.Numero);
            cmd.Parameters.AddWithValue("@serie", n.Serie);
            cmd.Parameters.AddWithValue("@modelo", n.Modelo);
            cmd.Parameters.AddWithValue("@codForn", n.CodForn);
            cmd.Parameters.AddWithValue("@dataEmissao", n.DataEmissao);
            cmd.Parameters.AddWithValue("@dataChegada", (object?)n.DataChegada ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@tipoFrete", n.TipoFrete);
            cmd.Parameters.AddWithValue("@valorProdutos", n.ValorProdutos);
            cmd.Parameters.AddWithValue("@valorFrete", n.ValorFrete);
            cmd.Parameters.AddWithValue("@valorSeguro", n.ValorSeguro);
            cmd.Parameters.AddWithValue("@outrasDespesas", n.OutrasDespesas);
            cmd.Parameters.AddWithValue("@valorDesconto", n.ValorDesconto);
            cmd.Parameters.AddWithValue("@valorTotal", n.ValorTotal);
            cmd.Parameters.AddWithValue("@codCondicao", (object?)n.CodCondicao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@codTransp", (object?)n.CodTransp ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@placaVeiculo", (object?)n.PlacaVeiculo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@observacoes", (object?)n.Observacoes ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@situacao", n.Situacao);
            cmd.Parameters.AddWithValue("@pedidoNumero", (object?)n.PedidoNumero ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@pedidoSerie", (object?)n.PedidoSerie ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@pedidoModelo", (object?)n.PedidoModelo ?? DBNull.Value);
        }

        static NotasEntradas Map(MySqlDataReader rd) => new()
        {
            Numero = rd.GetString("numero"),
            Serie = rd.GetString("serie"),
            Modelo = rd.GetString("modelo"),
            CodForn = rd.GetInt32("codForn"),
            DataEmissao = rd.GetDateTime("dataEmissao"),
            DataChegada = rd.IsDBNull(rd.GetOrdinal("dataChegada")) ? null : rd.GetDateTime("dataChegada"),
            TipoFrete = rd.GetString("tipoFrete"),
            ValorProdutos = rd.GetDecimal("valorProdutos"),
            ValorFrete = rd.GetDecimal("valorFrete"),
            ValorSeguro = rd.GetDecimal("valorSeguro"),
            OutrasDespesas = rd.GetDecimal("outrasDespesas"),
            ValorDesconto = rd.GetDecimal("valorDesconto"),
            ValorTotal = rd.GetDecimal("valorTotal"),
            CodCondicao = rd.IsDBNull(rd.GetOrdinal("codCondicao")) ? null : rd.GetInt32("codCondicao"),
            CodTransp = rd.IsDBNull(rd.GetOrdinal("codTransp")) ? null : rd.GetInt32("codTransp"),
            PlacaVeiculo = rd.IsDBNull(rd.GetOrdinal("placaVeiculo")) ? null : rd.GetString("placaVeiculo"),
            Observacoes = rd.IsDBNull(rd.GetOrdinal("observacoes")) ? null : rd.GetString("observacoes"),
            Situacao = rd.GetString("situacao"),

            PedidoNumero = rd.IsDBNull(rd.GetOrdinal("pedidoNumero")) ? null : rd.GetString("pedidoNumero"),
            PedidoSerie = rd.IsDBNull(rd.GetOrdinal("pedidoSerie")) ? null : rd.GetString("pedidoSerie"),
            PedidoModelo = rd.IsDBNull(rd.GetOrdinal("pedidoModelo")) ? null : rd.GetString("pedidoModelo"),

            Fornecedor = rd.IsDBNull(rd.GetOrdinal("Fornecedor")) ? null : new Fornecedores
            {
                CodForn = rd.GetInt32("CodForn"),
                Fornecedor = rd.GetString("Fornecedor"),
                Ativo = !rd.IsDBNull(rd.GetOrdinal("FornecedorAtivo")) && rd.GetBoolean("FornecedorAtivo"),
            },

            CondicaoPagamento = rd.IsDBNull(rd.GetOrdinal("CondicaoDescricao")) ? null : new CondicaoPagamentos
            {
                CodCondicao = rd.GetInt32("CodCondicao"),
                CondicaoPagamento = rd.IsDBNull(rd.GetOrdinal("CondicaoDescricao"))
                    ? null
                    : rd.GetString("CondicaoDescricao"),
            },

            Transportador = rd.IsDBNull(rd.GetOrdinal("Transportador")) ? null : new Transportadores
            {
                CodTransp = rd.GetInt32("CodTransp"),
                Transportador = rd.IsDBNull(rd.GetOrdinal("Transportador"))
                    ? null
                    : rd.GetString("Transportador"),
                Ativo = !rd.IsDBNull(rd.GetOrdinal("TransportadorAtivo")) && rd.GetBoolean("TransportadorAtivo"),
            }
        };

        static ProdutosNotaEntrada MapItem(MySqlDataReader rd) => new()
        {
            Numero = rd.GetString("numero"),
            Modelo = rd.GetString("modelo"),
            Serie = rd.GetString("serie"),
            CodForn = rd.GetInt32("codForn"),
            CodProd = rd.GetInt32("codProd"),
            Quantidade = rd.GetInt32("quantidade"),
            ValorUnitario = rd.GetDecimal("valorUnitario"),
            ValorTotal = rd.GetDecimal("valorTotal"),

            DescontoPercentual = rd.IsDBNull(rd.GetOrdinal("descontoPercentual"))
                ? 0
                : rd.GetDecimal("descontoPercentual"),

            DescontoValor = rd.IsDBNull(rd.GetOrdinal("descontoValor"))
                ? 0
                : rd.GetDecimal("descontoValor"),

            RateioFrete = rd.IsDBNull(rd.GetOrdinal("rateioFrete"))
                ? 0
                : rd.GetDecimal("rateioFrete"),

            RateioSeguro = rd.IsDBNull(rd.GetOrdinal("rateioSeguro"))
                ? 0
                : rd.GetDecimal("rateioSeguro"),

            RateioOutras = rd.IsDBNull(rd.GetOrdinal("rateioOutras"))
                ? 0
                : rd.GetDecimal("rateioOutras"),

            CustoFinal = rd.IsDBNull(rd.GetOrdinal("custoFinal"))
                ? 0
                : rd.GetDecimal("custoFinal"),

            Produto = rd.IsDBNull(rd.GetOrdinal("Produto")) ? null : new Produtos
            {
                CodProd = rd.GetInt32("CodProd"),
                Produto = rd.GetString("Produto"),
                Unidade = rd.IsDBNull(rd.GetOrdinal("ProdutoUnidade")) ? null : rd.GetString("ProdutoUnidade"),
                Ativo = !rd.IsDBNull(rd.GetOrdinal("ProdutoAtivo")) && rd.GetBoolean("ProdutoAtivo"),
            }
        };
    }
}

