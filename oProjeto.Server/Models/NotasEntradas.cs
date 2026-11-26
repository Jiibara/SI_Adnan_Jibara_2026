using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

using oProjeto.Server.Models;

public class NotasEntradas
{
    [StringLength(9), SomenteDigitos]
    public string Numero { get; set; }
    [StringLength(3), SomenteDigitos]
    public string Serie { get; set; }
    [StringLength(2), SomenteDigitos]
    public string Modelo { get; set; }
    public int CodForn { get; set; }
    public DateTime DataEmissao { get; set; }
    public DateTime? DataChegada { get; set; }
    [StringLength(3)]
    public string TipoFrete { get; set; } = string.Empty;
    public decimal ValorProdutos { get; set; }
    public decimal ValorFrete { get; set; }
    public decimal ValorSeguro { get; set; }
    public decimal OutrasDespesas { get; set; }
    public decimal ValorDesconto { get; set; }
    public decimal ValorTotal { get; set; }
    public int? CodCondicao { get; set; }
    public int? CodTransp { get; set; }
    [StringLength(11), Placa]
    public string? PlacaVeiculo { get; set; }
    public string? Observacoes { get; set; }
    [StringLength(20)]
    public string Situacao { get; set; } = "PENDENTE";

    public string? PedidoNumero { get; set; }
    public string? PedidoSerie { get; set; }
    public string? PedidoModelo { get; set; }

    public string? MotivoCancelamento { get; set; }

    public Fornecedores? Fornecedor { get; set; }
    public CondicaoPagamentos? CondicaoPagamento { get; set; }
    public Transportadores? Transportador { get; set; }
    public List<ProdutosNotaEntrada> Produtos { get; set; } = [];
}