using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class NfesController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.Nfes
                .Include(n => n.Fornecedor)
                .Include(n => n.Transportador)
                .Include(n => n.Veiculo)
                .OrderByDescending(n => n.DataEmit)
                .ToListAsync());

        [HttpGet("{numNfe}/{serie}/{modelo}")]
        public async Task<IActionResult> Get(int numNfe, int serie, int modelo)
        {
            var r = await db.Nfes
                .Include(n => n.Fornecedor)
                .Include(n => n.ProdNfes).ThenInclude(p => p.Produto)
                .FirstOrDefaultAsync(n => n.Numero == numNfe && n.Serie == serie && n.Modelo == modelo);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Nfes body)
        {
            db.Nfes.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { body.Numero, body.Serie, body.Modelo }, body);
        }

        [HttpPut("{numNfe}/{serie}/{modelo}")]
        public async Task<IActionResult> Update(int numNfe, int serie, int modelo, Nfes body)
        {
            if (numNfe != body.Numero || serie != body.Serie || modelo != body.Modelo) 
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{numNfe}/{serie}/{modelo}")]
        public async Task<IActionResult> Delete(int numNfe, int serie, int modelo)
        {
            var r = await db.Nfes.FindAsync(numNfe, serie, modelo);
            if (r is null) 
                return NotFound();
            db.Nfes.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}
