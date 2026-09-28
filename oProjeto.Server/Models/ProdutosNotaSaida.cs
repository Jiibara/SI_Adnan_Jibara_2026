namespace oProjeto.Server.Models
{
    public class ProdutosNotaSaida
    {
        public int Numero { get; set; }
        public int Modelo { get; set; }
        public int Serie { get; set; }
        public int CodCliente { get; set; }
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

