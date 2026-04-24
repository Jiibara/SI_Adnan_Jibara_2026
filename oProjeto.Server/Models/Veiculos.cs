using oProjeto.Server.Models;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

[Table("Veiculos")]
public class Veiculos
{
    [Key] public int CodVeic { get; set; }
    public string? PlacaVeic { get; set; }
    public int CodEstado { get; set; }
    public string? CodANTT { get; set; }

    [ForeignKey(nameof(CodEstado))] public Estados? Estado { get; set; }
    public ICollection<Nfes> Nfes { get; set; } = [];
}