using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;

/*namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class NcmShsController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.NcmShs.OrderBy(n => n.NcmSh).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var r = await db.NcmShs.FindAsync(id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(NcmShs body)
        {
            db.NcmShs.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = body.NcmSh }, body);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, NcmShs body)
        {
            if (id != body.NcmSh) 
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var r = await db.NcmShs.FindAsync(id);
            if (r is null) 
                return NotFound();
            db.NcmShs.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}
*/