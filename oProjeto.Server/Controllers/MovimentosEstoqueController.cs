using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class MovimentosEstoqueController(MovimentoEstoqueRepository repo) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await repo.GetAllAsync());

        [HttpGet("produto/{codProd:int}")]
        public async Task<IActionResult> GetByProduto(int codProd) =>
            Ok(await repo.GetByProdutoAsync(codProd));

        [HttpGet("entrada/{numero:int}/{modelo:int}/{serie:int}/{codForn:int}")]        public async Task<IActionResult> GetByNotaEntrada(int numero, int modelo, int serie, int codForn) =>
            Ok(await repo.GetByNotaEntradaAsync(numero, modelo, serie, codForn));

        [HttpGet("saida/{numero:int}/{modelo:int}/{serie:int}/{codCliente:int}")]
        public async Task<IActionResult> GetByNotaSaida(int numero, int modelo, int serie, int codCliente) =>
            Ok(await repo.GetByNotaSaidaAsync(numero, modelo, serie, codCliente));
    }
}