using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;

/*namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class ProdNFeController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.ProdNfes.Include(p => p.Produto).Include(p => p.Nfe).ToListAsync());

        [HttpGet("{numNfe}/{serie}/{modelo}/{codProd}")]
        public async Task<IActionResult> Get(int numNfe, int serie, int modelo, int codProd)
        {
            var r = await db.ProdNfes
                .Include(p => p.Produto)
                .FirstOrDefaultAsync(p =>
                    p.Numero == numNfe && p.Serie == serie && p.Modelo == modelo && p.CodProd == codProd);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpGet("nfe/{numNfe}/{serie}/{modelo}")]
        public async Task<IActionResult> GetByNFe(int numNfe, int serie, int modelo) =>
            Ok(await db.ProdNfes
                .Include(p => p.Produto)
                .Where(p => p.Numero == numNfe && p.Serie == serie && p.Modelo == modelo)
                .ToListAsync());

        [HttpPost]
        public async Task<IActionResult> Create(ProdNfes body)
        {
            db.ProdNfes.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { body.Numero, body.Serie, body.Modelo, body.CodProd }, body);
        }

        [HttpPut("{numNfe}/{serie}/{modelo}/{codProd}")]
        public async Task<IActionResult> Update(int numNfe, int serie, int modelo, int codProd, ProdNfes body)
        {
            if (numNfe != body.Numero || serie != body.Serie || modelo != body.Modelo || codProd != body.CodProd)
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{numNfe}/{serie}/{modelo}/{codProd}")]
        public async Task<IActionResult> Delete(int numNfe, int serie, int modelo, int codProd)
        {
            var r = await db.ProdNfes.FindAsync(numNfe, serie, modelo, codProd);
            if (r is null) 
                NotFound();
            db.ProdNfes.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}*/
