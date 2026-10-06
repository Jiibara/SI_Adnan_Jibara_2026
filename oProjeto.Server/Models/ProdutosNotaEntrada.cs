namespace oProjeto.Server.Models
{
    public class ProdutosNotaEntrada
    {
        public string Numero { get; set; }
        public string Modelo { get; set; }
        public string Serie { get; set; }
        public int CodForn { get; set; }
        public int CodProd { get; set; }
        public int Quantidade { get; set; }
        public decimal ValorUnitario { get; set; }
        public decimal ValorTotal { get; set; }
        public decimal DescontoPercentual { get; set; }
        public decimal DescontoValor { get; set; }
        public decimal RateioFrete { get; set; }
        public decimal RateioSeguro { get; set; }
        public decimal RateioOutras { get; set; }
        public decimal CustoFinal { get; set; }
        public Produtos? Produto { get; set; }
    }

}