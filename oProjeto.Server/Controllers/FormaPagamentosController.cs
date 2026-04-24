using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;
using System.Diagnostics.Contracts;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class FormaPagamentosController(AppDbContext db) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await db.FormaPagamentos.OrderBy(f => f.FormaPagamento).ToListAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await db.FormaPagamentos.FindAsync(id);
            return r is null ? NotFound() : Ok(r);
        }
        [HttpPost]
        async Task<IActionResult> Create(FormaPagamentos body)
        {
            db.FormaPagamentos.Add(body);
            await db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = body.CodFormaPagamento}, body);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, FormaPagamentos body)
        {
            if (id != body.CodFormaPagamento) 
                return BadRequest();
            db.Entry(body).State = EntityState.Modified;
            await db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await db.FormaPagamentos.FindAsync(id);
            if (r is null) 
                return NotFound();
            db.FormaPagamentos.Remove(r);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }
}
