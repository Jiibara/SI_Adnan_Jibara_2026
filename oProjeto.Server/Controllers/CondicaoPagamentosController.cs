using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class CondicaoPagamentosController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.CondicaoPagamentos.OrderBy(c => c.CondicaoPagamento).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await db.CondicaoPagamentos.FindAsync(id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CondicaoPagamentos body)
        {
            db.CondicaoPagamentos.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = body.CodCondicao}, body);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CondicaoPagamentos body)
        {
            if (id != body.CodCondicao)
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await db.CondicaoPagamentos.FindAsync(id);
            if (r is null)
                return NotFound();
            db.CondicaoPagamentos.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}
