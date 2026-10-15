using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.DTOs;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    // Atende as contas a receber de notas de produto (contasReceber)
    // e de notas de serviço (contasReceberServico) com as mesmas rotas.
    // O parâmetro ?tipo=PRODUTO ou ?tipo=SERVICO escolhe a tabela.
    [ApiController, Route("api/[controller]")]
    public class ContasReceberController(
        ContaReceberRepository repo,
        ContaReceberServicoRepository repoServico) : ControllerBase
    {
        private const string Produto = "PRODUTO";
        private const string Servico = "SERVICO";
        private const string TipoInvalido = "Tipo inválido. Use PRODUTO ou SERVICO.";

        // Só aceita valores conhecidos. Nunca repassa texto da tela adiante.
        private static string? NormalizarTipo(string? tipo) =>
            tipo?.Trim().ToUpperInvariant() switch
            {
                Produto => Produto,
                Servico => Servico,
                _ => null
            };

        // Sem ?tipo: devolve produto e serviço juntos.
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? tipo = null)
        {
            var t = NormalizarTipo(tipo);

            if (!string.IsNullOrWhiteSpace(tipo) && t is null)
                return BadRequest(TipoInvalido);

            var lista = new List<ContasReceber>();

            if (t is null or Produto)
            {
                var produtos = await repo.GetAllAsync();
                produtos.ForEach(c => c.TipoNota = Produto);
                lista.AddRange(produtos);
            }

            if (t is null or Servico)
            {
                var servicos = await repoServico.GetAllAsync();
                servicos.ForEach(c => c.TipoNota = Servico);
                lista.AddRange(servicos);
            }

            return Ok(lista
                .OrderBy(c => c.DataVencimento)
                .ThenBy(c => c.NotaNumero)
                .ThenBy(c => c.NotaSerie)
                .ThenBy(c => c.NotaModelo)
                .ThenBy(c => c.NumeroParcela));
        }

        // Daqui para baixo o tipo é obrigatório: a mesma nota/parcela pode existir nas duas tabelas.
        [HttpGet("{numero}/{modelo}/{serie}/{codCliente:int}/{numeroParcela:int}")]
        public async Task<IActionResult> GetById(
            string numero,
            string modelo,
            string serie,
            int codCliente,
            int numeroParcela,
            [FromQuery] string? tipo)
        {
            var t = NormalizarTipo(tipo);
            if (t is null) return BadRequest(TipoInvalido);

            var conta = t == Servico
                ? await repoServico.GetByIdAsync(numero, modelo, serie, codCliente, numeroParcela)
                : await repo.GetByIdAsync(numero, modelo, serie, codCliente, numeroParcela);

            if (conta is null) return NotFound();

            conta.TipoNota = t;
            return Ok(conta);
        }

        [HttpGet("nota/{numero}/{modelo}/{serie}/{codCliente:int}")]
        public async Task<IActionResult> GetByNota(
            string numero,
            string modelo,
            string serie,
            int codCliente,
            [FromQuery] string? tipo)
        {
            var t = NormalizarTipo(tipo);
            if (t is null) return BadRequest(TipoInvalido);

            var contas = t == Servico
                ? await repoServico.GetByNotaAsync(numero, modelo, serie, codCliente)
                : await repo.GetByNotaAsync(numero, modelo, serie, codCliente);

            contas.ForEach(c => c.TipoNota = t);
            return Ok(contas);
        }

        [HttpPut("receber/{numero}/{modelo}/{serie}/{codCliente:int}/{numeroParcela:int}")]
        public async Task<IActionResult> Receber(
            string numero,
            string modelo,
            string serie,
            int codCliente,
            int numeroParcela,
            [FromQuery] string? tipo,
            ReceberContaRequest body)
        {
            var t = NormalizarTipo(tipo);
            if (t is null) return BadRequest(TipoInvalido);

            try
            {
                if (t == Servico)
                    await repoServico.ReceberAsync(numero, modelo, serie, codCliente, numeroParcela, body);
                else
                    await repo.ReceberAsync(numero, modelo, serie, codCliente, numeroParcela, body);

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}