using oProjeto.Server.Models;
using System.ComponentModel.DataAnnotations.Schema;
public class Nfes
{
    public int Numero { get; set; }
    public int Serie { get; set; }
    public int Modelo { get; set; }
    public int CodForn { get; set; }
    public int? Pagina { get; set; }
    public string? NatOper { get; set; }
    public string? ProtAcesso { get; set; }
    public DateOnly? DataProtAcesso { get; set; }
    public TimeOnly? HoraProtAcesso { get; set; }
    public string? ChaveAcesso { get; set; }
    public DateOnly? DataEmit { get; set; }
    public DateOnly? DataEnt { get; set; }
    public TimeOnly? HoraEnt { get; set; }
    public decimal? BaseCalcIcms { get; set; }
    public decimal? ValorIcms { get; set; }
    public decimal? BaseCalcIcmsSub { get; set; }
    public decimal? ValorIcmsSub { get; set; }
    public decimal? ValorFrete { get; set; }
    public decimal? ValorSeguro { get; set; }
    public decimal? Desconto { get; set; }
    public decimal? OutrasDesp { get; set; }
    public decimal? ValorIpi { get; set; }
    public int? CodTransp { get; set; }
    public string? FretePorConta { get; set; }
    public int? CodVeic { get; set; }
    public int? Quantidade { get; set; }
    public string? Especie { get; set; }
    public string? Marca { get; set; }
    public decimal? PesoBruto { get; set; }
    public decimal? PesoLiq { get; set; }
    public string? InfComp { get; set; }
    public bool Ativo { get; set; }
    public Fornecedores? Fornecedor { get; set; }
    public Transportadores? Transportador { get; set; }
    public Veiculos? Veiculo { get; set; }
}
