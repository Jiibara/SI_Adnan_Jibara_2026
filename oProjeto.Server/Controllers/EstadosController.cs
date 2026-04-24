using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class EstadosController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.Estados.Include(e => e.Pais).OrderBy(e => e.Estado).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await db.Estados.Include(e => e.Pais).FirstOrDefaultAsync(e => e.CodEstado == id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Estados body)
        {
            db.Estados.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = body.CodEstado }, body);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Estados body)
        {
            if (id != body.CodEstado) 
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await db.Estados.FindAsync(id);
            if (r is null) 
                return NotFound();
            db.Estados.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}

