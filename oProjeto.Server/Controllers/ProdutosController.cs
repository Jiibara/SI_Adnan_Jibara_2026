using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class ProdutosController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.Produtos.Include(p => p.NcmShs).OrderBy(p => p.Produto).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await db.Produtos.Include(p => p.NcmShs).FirstOrDefaultAsync(p => p.CodProd == id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Produtos body)
        {
            db.Produtos.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = body.CodProd }, body);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Produtos body)
        {
            if (id != body.CodProd) 
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await db.Produtos.FindAsync(id);
            if (r is null) 
                return NotFound();
            db.Produtos.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}
