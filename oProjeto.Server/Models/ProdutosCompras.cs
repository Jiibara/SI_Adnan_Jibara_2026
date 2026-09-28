namespace oProjeto.Server.Models
{
    public class ProdutosCompras
    {
        public int Numero { get; set; }
        public int Serie { get; set; }
        public int Modelo { get; set; }
        public int CodForn { get; set; }
        public int CodProd { get; set; }
        public decimal Quantidade { get; set; }
        public decimal ValorUnitario { get; set; }
        public decimal DescontoPercentual { get; set; }
        public decimal DescontoValor { get; set; }
        public decimal ValorTotal { get; set; }
        public decimal RateioFrete { get; set; }
        public decimal RateioSeguro { get; set; }
        public decimal RateioOutras { get; set; }
        public decimal CustoFinal { get; set; }
        public decimal QuantidadeRecebida { get; set; }
        public decimal QuantidadePendente => Math.Max(Quantidade - QuantidadeRecebida, 0);
        public Produtos? Produto { get; set; }
    }
}
