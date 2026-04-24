using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class FornecedoresController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.Fornecedores.Include(f => f.Cidade).OrderBy(f => f.Fornecedor).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await db.Fornecedores.Include(f => f.Cidade).FirstOrDefaultAsync(f => f.CodForn == id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Fornecedores body)
        {
            db.Fornecedores.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = body.CodForn }, body);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Fornecedores body)
        {
            if (id != body.CodForn) 
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await db.Fornecedores.FindAsync(id);
            if (r is null) 
                return NotFound();
            db.Fornecedores.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}
