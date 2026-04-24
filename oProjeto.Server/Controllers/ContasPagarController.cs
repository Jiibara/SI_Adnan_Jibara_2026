using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class ContasPagarController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.ContasPagar
                .Include(c => c.Fornecedor)
                .Include(c => c.Nfe)
                .OrderBy(c => c.VencimentoParcela)
                .ToListAsync());

        [HttpGet("{numNfe}/{serie}/{modelo}/{codForn}/{numParcNFe}")]
        public async Task<IActionResult> Get(int numNfe, int serie, int modelo, int codForn, int numParcNFe)
        {
            var r = await db.ContasPagar
                .Include(c => c.Fornecedor)
                .Include(c => c.Nfe)
                .FirstOrDefaultAsync(c =>
                    c.Numero == numNfe &&
                    c.Serie == serie &&
                    c.Modelo == modelo &&
                    c.CodForn == codForn &&
                    c.NumeroParcela == numParcNFe);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(ContasPagar body)
        {
            db.ContasPagar.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new
            {
                numNfe = body.Numero,
                serie = body.Serie,
                modelo = body.Modelo,
                codForn = body.CodForn,
                numParcNFe = body.NumeroParcela
            }, body);
        }

        [HttpPut("{numero}/{serie}/{modelo}/{codForn}/{numeroParcela}")]
        public async Task<IActionResult> Update(
            int numNfe, int serie, int modelo, int codForn, int numParcNFe,
            ContasPagar body)
        {
            if (numNfe != body.Numero ||
                serie != body.Serie ||
                modelo != body.Modelo ||
                codForn != body.CodForn ||
                numParcNFe != body.NumeroParcela)
                return BadRequest();

            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{numNfe}/{serie}/{modelo}/{codForn}/{numParcNFe}")]
        public async Task<IActionResult> Delete(
            int numNfe, int serie, int modelo, int codForn, int numParcNFe)
        {
            var r = await db.ContasPagar.FindAsync(numNfe, serie, modelo, codForn, numParcNFe);
            if (r is null) 
                return NotFound();
            db.ContasPagar.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}