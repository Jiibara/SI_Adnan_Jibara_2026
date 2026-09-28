namespace oProjeto.Server.Models
{
    public class Compras
    {
        public int Numero { get; set; }
        public int Serie { get; set; }
        public int Modelo { get; set; }
        public int CodForn { get; set; }
        public DateTime DataCompra { get; set; }
        public DateTime? DataPrevisaoEntrega { get; set; }
        public int? CodCondicao { get; set; }
        public decimal ValorProdutos { get; set; }
        public decimal ValorDesconto { get; set; }
        public decimal ValorFrete { get; set; }
        public decimal ValorSeguro { get; set; }
        public decimal OutrasDespesas { get; set; }
        public decimal ValorTotal { get; set; }
        public string? Observacoes { get; set; }
        public string Situacao { get; set; } = "ABERTA";
        public List<ProdutosCompras> Produtos { get; set; } = [];
        public Fornecedores? Fornecedor { get; set; }
        public CondicaoPagamentos? Condicao { get; set; }
    }
}
