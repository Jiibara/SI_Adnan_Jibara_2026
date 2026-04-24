using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class VeiculosController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.Veiculos.Include(v => v.Estado).OrderBy(v => v.PlacaVeic).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await db.Veiculos.Include(v => v.Estado).FirstOrDefaultAsync(v => v.CodVeic == id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Veiculos body)
        {
            db.Veiculos.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = body.CodVeic }, body);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Veiculos body)
        {
            if (id != body.CodVeic) 
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await db.Veiculos.FindAsync(id);
            if (r is null) 
                return NotFound();
            db.Veiculos.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}
