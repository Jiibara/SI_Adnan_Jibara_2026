using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class CidadesController(CidadeRepository repo) : ControllerBase
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
        public async Task<IActionResult> Create(Cidades body)
        {
            var created = await repo.CreateAsync(body);
            return CreatedAtAction(nameof(Get), new { id = created.CodCidade }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Cidades body)
        {
            if (id != body.CodCidade) return BadRequest();
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