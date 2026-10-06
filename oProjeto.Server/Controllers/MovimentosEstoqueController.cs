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

        [HttpGet("entrada/{numero}/{modelo}/{serie}/{codForn:int}")]       
        public async Task<IActionResult> GetByNotaEntrada(string numero, string modelo, string serie, int codForn) =>
            Ok(await repo.GetByNotaEntradaAsync(numero, modelo, serie, codForn));

        [HttpGet("saida/{numero}/{modelo}/{serie}/{codCliente:int}")]
        public async Task<IActionResult> GetByNotaSaida(string numero, string modelo, string serie, int codCliente) =>
            Ok(await repo.GetByNotaSaidaAsync(numero, modelo, serie, codCliente));
    }
}