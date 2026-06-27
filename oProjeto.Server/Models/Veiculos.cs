using oProjeto.Server.Models;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

public class Veiculos
{
    public int CodVeic { get; set; }
    public string? PlacaVeic { get; set; }
    public string? PlacaMercoSul { get; set; }
    public string? Modelo { get; set; }
    public string? CodANTT { get; set; }
    public int CodEstado { get; set; }
    public int? CodMarca { get; set; } 
    public bool Ativo { get; set; }
   public Estados? Estado { get; set; }
    public Marcas? Marca { get; set; }
}

