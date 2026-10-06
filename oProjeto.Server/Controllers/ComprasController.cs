using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class ComprasController(CompraRepository repo) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await repo.GetAllAsync());

        [HttpGet("fornecedor/{codForn:int}")]
        public async Task<IActionResult> GetByFornecedor(int codForn) =>
            Ok(await repo.GetByFornecedorAsync(codForn));

        [HttpGet("pendentes/{codForn:int}")]
        public async Task<IActionResult> GetPendentesPorFornecedor(int codForn) =>
            Ok(await repo.GetPendentesAsync(codForn));

        [HttpGet("{numero}/{serie}/{modelo}/{codForn:int}")]
        public async Task<IActionResult> Get(string numero, string serie, string modelo, int codForn)
        {
            var r = await repo.GetByIdAsync(numero, serie, modelo, codForn);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Compras body)
        {
            try
            {
                var created = await repo.CreateAsync(body);
                return CreatedAtAction(nameof(Get),
                    new
                    {
                        numero = created.Numero,
                        serie = created.Serie,
                        modelo = created.Modelo,
                        codForn = created.CodForn
                    },
                    created);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPut("{numero}/{modelo}/{serie}/{codForn:int}")]
        public async Task<IActionResult> Update(string numero, string serie, string modelo, int codForn, Compras body)
        {
            if (numero != body.Numero ||
                serie != body.Serie ||
                modelo != body.Modelo ||
                codForn != body.CodForn)
                return BadRequest();

            var existente = await repo.GetByIdAsync(numero, serie, modelo, codForn);
            if (existente is null) return NotFound();

            await repo.UpdateAsync(body);
            return NoContent();
        }

        [HttpDelete("{numero}/{modelo}/{serie}/{codForn:int}")]
        public async Task<IActionResult> Delete(string numero, string serie, string modelo, int codForn)
        {
            var r = await repo.GetByIdAsync(numero, serie, modelo, codForn);
            if (r is null) return NotFound();

            await repo.DeleteAsync(numero, serie, modelo, codForn);
            return NoContent();
        }
    }
}
