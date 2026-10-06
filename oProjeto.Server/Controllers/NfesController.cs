using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Models;
using oProjeto.Server.Repositories;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NfeController(NfeRepository repo) : ControllerBase
    {
        [HttpGet]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var nfes = await repo.GetAllAsync();
                return Ok(nfes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = ex.Message,
                    inner = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("{numero}/{serie}/{modelo}/{codForn}")]
        public async Task<IActionResult> GetById(string numero, string serie, string modelo, int codForn)
        {
            var nfe = await repo.GetByIdAsync(numero, serie, modelo, codForn);
            if (nfe == null) return NotFound();

            return Ok(nfe);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Nfes body)
        {
            var created = await repo.CreateAsync(body);
            return CreatedAtAction(nameof(GetById), new { numero = created.Numero, serie = created.Serie, modelo = created.Modelo }, created);
        }

        [HttpPut("{numero}/{serie}/{modelo}")]
        public async Task<IActionResult> Update(string numero, string serie, string modelo, [FromBody] Nfes body)
        {
            if (numero != body.Numero || serie != body.Serie || modelo != body.Modelo)
                return BadRequest("Chaves primárias divergentes.");

            await repo.UpdateAsync(body);
            return NoContent();
        }

        [HttpDelete("{numero}/{serie}/{modelo}/{codForn}")]
        public async Task<IActionResult> Delete(string numero, string serie, string modelo, int codForn)
        {
            var nfe = await repo.GetByIdAsync(numero, serie, modelo, codForn);
            if (nfe == null) return NotFound();

            await repo.DeleteAsync(numero, serie, modelo, codForn);
            return NoContent();
        }
    }
}