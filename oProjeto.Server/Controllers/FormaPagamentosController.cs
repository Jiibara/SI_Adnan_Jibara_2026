using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;
using System.Diagnostics.Contracts;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class FormaPagamentosController(FormaPagamentoRepository repo) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
                    Ok(await repo.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var r = await repo.GetByIdAsync(id);
            return r is null ? NotFound() : Ok(r);
        }

        [HttpPost]
        public async Task<IActionResult> Create(FormaPagamentos body)
        {
            var created = await repo.CreateAsync(body);
            return CreatedAtAction(nameof(Get), new { id = created.CodFormaPagamento }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, FormaPagamentos body)
        {
            if (id != body.CodFormaPagamento) return BadRequest();
            await repo.UpdateAsync(body);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await repo.GetByIdAsync(id);
            if (r is null) return NotFound();
            await repo.DeleteAsync(id);
            return NoContent();
        }
    }
}
