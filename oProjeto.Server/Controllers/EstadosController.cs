using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class EstadosController(EstadoRepository repo) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await repo.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await repo.GetByIdAsync(id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Estados body)
        {
            var created = await repo.CreateAsync(body);
            return CreatedAtAction(nameof(Get), new { id = created.CodEstado }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Estados body)
        {
            if (id != body.CodEstado) return BadRequest();
            await repo.UpdateAsync(body);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await repo.GetByIdAsync(id);
            if (r is null) return NotFound();
            await repo.DeleteAsync(id);
            return NoContent();
        }
    }
}