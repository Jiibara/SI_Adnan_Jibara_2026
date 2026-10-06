using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class NotasSaidaController(NotaSaidaRepository repo) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await repo.GetAllAsync());

        [HttpGet("fornecedor/{codCliente:int}")]
        public async Task<IActionResult> GetByCliente(int codCliente) =>
            Ok(await repo.GetByClienteAsync(codCliente));

        [HttpGet("{numero}/{modelo}/{serie}/{codCliente:int}")]
        public async Task<IActionResult> Get(string numero, string modelo, string serie, int codCliente)
        {
            var r = await repo.GetByIdAsync(numero, modelo, serie, codCliente);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(NotasSaidas body)
        {
            var created = await repo.CreateAsync(body);
            return CreatedAtAction(nameof(Get),
                new { numero = created.Numero, modelo = created.Modelo, serie = created.Serie, codCliente = created.CodCliente },
                created);
        }

        [HttpPut("{numero}/{modelo}/{serie}/{codCliente:int}")]
        public async Task<IActionResult> Update(string numero, string modelo, string serie, int codCliente, NotasSaidas body)
        {
            if (numero != body.Numero || modelo != body.Modelo || serie != body.Serie || codCliente != body.CodCliente)
                return BadRequest();

            var existente = await repo.GetByIdAsync(numero, modelo, serie, codCliente);
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

        [HttpPut("confirmar/{numero}/{modelo}/{serie}/{codCliente:int}")]
        public async Task<IActionResult> Confirmar(string numero, string modelo, string serie, int codCliente)
        {
            try
            {
                await repo.ConfirmarAsync(numero, modelo, serie, codCliente);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{numero}/{modelo}/{serie}/{codCliente:int}")]
        public async Task<IActionResult> Delete(string numero, string modelo, string serie, int codCliente)
        {
            var r = await repo.GetByIdAsync(numero, modelo, serie, codCliente);
            if (r is null) return NotFound();

            try
            {
                await repo.DeleteAsync(numero, modelo, serie, codCliente);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}