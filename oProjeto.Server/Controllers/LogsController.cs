using Microsoft.AspNetCore.Mvc;
using oProjeto.Server.Repository;

namespace oProjeto.Server.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class LogsController(LogRepository repo) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await repo.GetAllAsync());
    }
}