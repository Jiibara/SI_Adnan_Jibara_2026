using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class NotasEntradaController(NotaEntradaRepository repo) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await repo.GetAllAsync());

        [HttpGet("fornecedor/{codForn:int}")]
        public async Task<IActionResult> GetByFornecedor(int codForn) =>
            Ok(await repo.GetByFornecedorAsync(codForn));

        [HttpGet("{numero}/{modelo}/{serie}/{codForn:int}")]
        public async Task<IActionResult> Get(string numero, string modelo, string serie, int codForn)
        {
            var r = await repo.GetByIdAsync(numero, modelo, serie, codForn);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(NotasEntradas body)
        {
            var created = await repo.CreateAsync(body);
            return CreatedAtAction(nameof(Get),
                new { numero = created.Numero, modelo = created.Modelo, serie = created.Serie, codForn = created.CodForn },
                created);
        }

        [HttpPut("{numero}/{modelo}/{serie}/{codForn:int}")]
        public async Task<IActionResult> Update(string numero, string modelo, string serie, int codForn, NotasEntradas body)
        {
            if (numero != body.Numero || modelo != body.Modelo || serie != body.Serie || codForn != body.CodForn)
                return BadRequest();

            var existente = await repo.GetByIdAsync(numero, modelo, serie, codForn);
            if (existente is null) return NotFound();

            try
            {
                await repo.UpdateAsync(body);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("confirmar/{numero}/{modelo}/{serie}/{codForn:int}")]
        public async Task<IActionResult> Confirmar(string numero, string modelo, string serie, int codForn)
        {
            try
            {
                await repo.ConfirmarAsync(numero, modelo, serie, codForn);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{numero}/{modelo}/{serie}/{codForn:int}")]
        public async Task<IActionResult> Delete(string numero, string modelo, string serie, int codForn)
        {
            var r = await repo.GetByIdAsync(numero, modelo, serie, codForn);
            if (r is null) return NotFound();

            try
            {
                await repo.DeleteAsync(numero, modelo, serie, codForn);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /*[HttpPut("cancelar/{numero}/{modelo}/{serie}/{codForn:int}")]
        public async Task<IActionResult> Cancelar(string numero, string modelo, string serie, int codForn, NotasEntradas body)
        {
            if (string.IsNullOrWhiteSpace(body.MotivoCancelamento))
                return BadRequest("Informe o motivo do cancelamento.");

            try
            {
                await repo.CancelarAsync(numero, modelo, serie, codForn, body.MotivoCancelamento.Trim());
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }*/

        [HttpPut("cancelar/{numero}/{modelo}/{serie}/{codForn:int}")]
        public async Task<IActionResult> Cancelar(
            string numero,
            string modelo,
            string serie,
            int codForn,
            CancelarNotaRequest body)
        {
            if (string.IsNullOrWhiteSpace(body.MotivoCancelamento))
                return BadRequest("Informe o motivo do cancelamento.");

            try
            {
                await repo.CancelarAsync(
                    numero,
                    modelo,
                    serie,
                    codForn,
                    body.MotivoCancelamento.Trim());

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        public class CancelarNotaRequest
        {
            public string? MotivoCancelamento { get; set; }
        }
    }
}