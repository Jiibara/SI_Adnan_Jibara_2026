using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class TransportadoresController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.Transportadores.Include(t => t.Cidade).OrderBy(t => t.Transportador).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await db.Transportadores.Include(t => t.Cidade).FirstOrDefaultAsync(t => t.CodTransp == id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Transportadores body)
        {
            db.Transportadores.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = body.CodTransp }, body);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Transportadores body)
        {
            if (id != body.CodTransp) 
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await db.Transportadores.FindAsync(id);
            if (r is null) 
                return NotFound();
            db.Transportadores.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}
