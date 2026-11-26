using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

using oProjeto.Server.Models;
using System.ComponentModel.DataAnnotations.Schema;

public class Veiculos
{
    public int CodVeic { get; set; }
    [StringLength(11), Placa]
    public string? PlacaVeic { get; set; }
    [StringLength(7), Placa]
    public string? PlacaMercoSul { get; set; }
    [StringLength(20)]
    public string? Modelo { get; set; }
    [StringLength(8)]
    public string? CodANTT { get; set; }
    public int CodEstado { get; set; }
    public int? CodMarca { get; set; } 
    public bool Ativo { get; set; }
   public Estados? Estado { get; set; }
    public Marcas? Marca { get; set; }
}

