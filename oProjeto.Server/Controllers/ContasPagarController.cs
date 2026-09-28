using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class ContasPagarController(ContaPagarRepository repo) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await repo.GetAllAsync());

        [HttpGet("{numero:int}/{modelo:int}/{serie:int}/{codForn:int}/{numeroParcela:int}")]
        public async Task<IActionResult> GetById(
            int numero,
            int modelo,
            int serie,
            int codForn,
            int numeroParcela)
        {
            var conta = await repo.GetByIdAsync(
                numero,
                modelo,
                serie,
                codForn,
                numeroParcela);

            return conta is null ? NotFound() : Ok(conta);
        }

        [HttpGet("nota/{numero:int}/{modelo:int}/{serie:int}/{codForn:int}")]
        public async Task<IActionResult> GetByNota(
            int numero,
            int modelo,
            int serie,
            int codForn) =>
            Ok(await repo.GetByNotaAsync(numero, modelo, serie, codForn));

        [HttpPut("pagar/{numero:int}/{modelo:int}/{serie:int}/{codForn:int}/{numeroParcela:int}")]
        public async Task<IActionResult> Pagar(
            int numero,
            int modelo,
            int serie,
            int codForn,
            int numeroParcela,
            ContasPagar body)
        {
            try
            {
                await repo.PagarAsync(
                    numero,
                    modelo,
                    serie,
                    codForn,
                    numeroParcela,
                    body);

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}