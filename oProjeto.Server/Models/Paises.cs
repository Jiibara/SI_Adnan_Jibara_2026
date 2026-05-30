using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models;

[Table("Paises")]
public class Paises
{
    [Key] public int CodPais { get; set; }
    public string Pais { get; set; }  
    public string Sigla { get; set; }
    public string DDI { get; set; }
    public string Moeda { get; set; }
    public bool Ativo { get; set; }

}
