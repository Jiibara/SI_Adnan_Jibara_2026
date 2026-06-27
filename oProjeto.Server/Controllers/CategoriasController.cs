using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class CategoriasController(CategoriaRepository repo) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await repo.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await repo.GetByIdAsync(id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Categorias body)
        {
            var created = await repo.CreateAsync(body);
            return CreatedAtAction(nameof(Get), new { id = created.CodCategoria }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Categorias body)
        {
            if (id != body.CodCategoria) return BadRequest();
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
