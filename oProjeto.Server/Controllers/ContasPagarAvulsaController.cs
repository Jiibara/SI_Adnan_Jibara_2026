using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    public class PagamentoContaAvulsaRequest
    {
        public DateTime DataPagamento { get; set; }
        public int? CodFormaPagamento { get; set; }
    }

    [ApiController, Route("api/[controller]")]
    public class ContasPagarAvulsaController(ContaPagarAvulsaRepository repo) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await repo.GetAllAsync());

        [HttpGet("{numeroNota}/{modelo}/{serie}/{codForn:int}/{numeroParcela:int}")]
        public async Task<IActionResult> Get(
            string numeroNota,
            string modelo,
            string serie,
            int codForn,
            int numeroParcela)
        {
            var r = await repo.GetByIdAsync(
                numeroNota,
                modelo,
                serie,
                codForn,
                numeroParcela);

            return r is null ? NotFound() : Ok(r);
        }

        [HttpGet("fornecedor/{codForn:int}")]
        public async Task<IActionResult> GetByFornecedor(int codForn) =>
            Ok(await repo.GetByFornecedorAsync(codForn));

        [HttpPost]
        public async Task<IActionResult> Create(ContasPagarAvulsa body)
        {
            try
            {
                var created = await repo.CreateAsync(body);

                return CreatedAtAction(
                    nameof(Get),
                    new
                    {
                        numeroNota = created.NotaNumero,
                        modelo = created.NotaModelo,
                        serie = created.NotaSerie,
                        codForn = created.CodForn,
                        numeroParcela = created.NumeroParcela
                    },
                    created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Registra o pagamento de uma parcela.
        /// Juros, multa e desconto são calculados no servidor a partir da condição de pagamento.
        /// </summary>
        [HttpPut("pagar/{notaNumero}/{notaModelo}/{notaSerie}/{codForn:int}/{numeroParcela:int}")]
        public async Task<IActionResult> Pagar(
            string notaNumero,
            string notaModelo,
            string notaSerie,
            int codForn,
            int numeroParcela,
            [FromBody] PagamentoContaAvulsaRequest body)
        {
            try
            {
                var existente = await repo.GetByIdAsync(
                    notaNumero,
                    notaModelo,
                    notaSerie,
                    codForn,
                    numeroParcela);

                if (existente is null)
                    return NotFound("Conta a pagar avulsa não encontrada.");

                var pago = await repo.PagarAsync(
                    notaNumero,
                    notaModelo,
                    notaSerie,
                    codForn,
                    numeroParcela,
                    body.DataPagamento,
                    body.CodFormaPagamento);

                return Ok(pago);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Cancela a conta inteira (todas as parcelas da nota/fornecedor).
        /// Não permite cancelar se existir parcela paga.
        /// </summary>
        [HttpPut("cancelar/{notaNumero}/{notaModelo}/{notaSerie}/{codForn:int}")]
        public async Task<IActionResult> Cancelar(
            string notaNumero,
            string notaModelo,
            string notaSerie,
            int codForn)
        {
            try
            {
                await repo.CancelarAsync(
                    notaNumero,
                    notaModelo,
                    notaSerie,
                    codForn);

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{numeroNota}/{modelo}/{serie}/{codForn:int}/{numeroParcela:int}")]
        public async Task<IActionResult> Update(
            string numeroNota,
            string modelo,
            string serie,
            int codForn,
            int numeroParcela,
            ContasPagarAvulsa body)
        {
            if (numeroNota != body.NotaNumero ||
                modelo != body.NotaModelo ||
                serie != body.NotaSerie ||
                codForn != body.CodForn ||
                numeroParcela != body.NumeroParcela)
                return BadRequest();

            try
            {
                var existente = await repo.GetByIdAsync(
                    numeroNota,
                    modelo,
                    serie,
                    codForn,
                    numeroParcela);

                if (existente is null)
                    return NotFound();

                await repo.UpdateAsync(body);

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{numeroNota}/{modelo}/{serie}/{codForn:int}/{numeroParcela:int}")]
        public async Task<IActionResult> Delete(
            string numeroNota,
            string modelo,
            string serie,
            int codForn,
            int numeroParcela)
        {
            try
            {
                var existente = await repo.GetByIdAsync(
                    numeroNota,
                    modelo,
                    serie,
                    codForn,
                    numeroParcela);

                if (existente is null)
                    return NotFound();

                await repo.DeleteAsync(
                    numeroNota,
                    modelo,
                    serie,
                    codForn,
                    numeroParcela);

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}