using oProjeto.Server.Models;

public class NotasEntradas
{
    public int Numero { get; set; }
    public int Serie { get; set; }
    public int Modelo { get; set; }
    public int CodForn { get; set; }
    public DateTime DataEmissao { get; set; }
    public DateTime? DataChegada { get; set; }
    public string TipoFrete { get; set; } = string.Empty;
    public decimal ValorProdutos { get; set; }
    public decimal ValorFrete { get; set; }
    public decimal ValorSeguro { get; set; }
    public decimal OutrasDespesas { get; set; }
    public decimal ValorDesconto { get; set; }
    public decimal ValorTotal { get; set; }
    public int? CodCondicao { get; set; }
    public int? CodTransp { get; set; }
    public string? PlacaVeiculo { get; set; }
    public string? Observacoes { get; set; }
    public string Situacao { get; set; } = "PENDENTE";

    public int? PedidoNumero { get; set; }
    public int? PedidoSerie { get; set; }
    public int? PedidoModelo { get; set; }

    public Fornecedores? Fornecedor { get; set; }
    public CondicaoPagamentos? CondicaoPagamento { get; set; }
    public Transportadores? Transportador { get; set; }
    public List<ProdutosNotaEntrada> Produtos { get; set; } = [];
}