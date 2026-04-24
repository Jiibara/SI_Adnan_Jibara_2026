using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class CidadesController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.Cidades.Include(c => c.Estado).OrderBy(c => c.Cidade).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await db.Cidades.Include(c => c.Estado).FirstOrDefaultAsync(c => c.CodCidade == id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Cidades body)
        {
            db.Cidades.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = body.CodCidade }, body);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Cidades body)
        {
            if (id != body.CodCidade) 
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await db.Cidades.FindAsync(id);
            if (r is null) 
                return NotFound();
            db.Cidades.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}
