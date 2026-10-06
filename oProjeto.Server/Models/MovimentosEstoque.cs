using oProjeto.Server.Models;

public class MovimentosEstoque
{
    public string Tipo { get; set; } = string.Empty; 
    public string Numero { get; set; }
    public string Modelo { get; set; }
    public string Serie { get; set; }
    public int CodParceiro { get; set; } 
    public int CodProd { get; set; }
    public decimal Quantidade { get; set; }
    public decimal CustoUnitario { get; set; }
    public decimal ValorTotal { get; set; }
    public decimal SaldoAnterior { get; set; }
    public decimal SaldoPosterior { get; set; }
    public decimal CustoMedioAnterior { get; set; }
    public decimal CustoMedioPosterior { get; set; }
    public DateTime DataMovimento { get; set; }
    public string? Observacao { get; set; }
    public Produtos? Produto { get; set; }
}