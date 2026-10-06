using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class ContasReceberController(ContaReceberRepository repo) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await repo.GetAllAsync());

        [HttpGet("{numero}/{modelo}/{serie}/{codCliente:int}/{numeroParcela:int}")]
        public async Task<IActionResult> GetById(
            string numero,
            string modelo,
            string serie,
            int codCliente,
            int numeroParcela)
        {
            var conta = await repo.GetByIdAsync(
                numero,
                modelo,
                serie,
                codCliente,
                numeroParcela);

            return conta is null ? NotFound() : Ok(conta);
        }

        [HttpGet("nota/{numero}/{modelo}/{serie}/{codCliente:int}")]
        public async Task<IActionResult> GetByNota(
            string numero,
            string modelo,
            string serie,
            int codCliente) =>
            Ok(await repo.GetByNotaAsync(numero, modelo, serie, codCliente));

        [HttpPut("receber/{numero}/{modelo}/{serie}/{codCliente:int}/{numeroParcela:int}")]
        public async Task<IActionResult> Receber(
            string numero,
            string modelo,
            string serie,
            int codCliente,
            int numeroParcela,
            ContasReceber body)
        {
            try
            {
                await repo.ReceberAsync(
                    numero,
                    modelo,
                    serie,
                    codCliente,
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