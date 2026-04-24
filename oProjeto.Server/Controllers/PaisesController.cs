using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class PaisesController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.Paises.OrderBy(p => p.Pais).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await db.Paises.FindAsync(id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Paises body)
        {
            db.Paises.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = body.CodPais }, body);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Paises body)
        {
            if (id != body.CodPais) 
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await db.Paises.FindAsync(id);
            if (r is null) 
                return NotFound();
            db.Paises.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}
