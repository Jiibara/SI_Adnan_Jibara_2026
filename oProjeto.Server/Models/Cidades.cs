using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace oProjeto.Server.Models
{
public class Cidades
{
    public int CodCidade { get; set; }
    public string? Cidade { get; set; }
    public string? DDD { get; set; }
    public int CodEstado { get; set; }
    public bool Ativo { get; set; }
    public Estados? Estado { get; set; }
}
}
