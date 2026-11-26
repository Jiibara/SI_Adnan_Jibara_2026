using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models;

public class Paises
{
    public int CodPais { get; set; }
    [StringLength(55)]
    public string Pais { get; set; }  
    [StringLength(3)]
    public string Sigla { get; set; }
    [StringLength(5)]
    public string DDI { get; set; }
    [StringLength(5)]
    public string Moeda { get; set; }
    public bool Ativo { get; set; }

}
