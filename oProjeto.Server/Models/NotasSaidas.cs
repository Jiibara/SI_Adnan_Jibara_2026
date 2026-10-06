namespace oProjeto.Server.Models
{
    public class NotasSaidas
    {
        public string Numero { get; set; }
        public string Serie { get; set; }
        public string Modelo { get; set; }
        public int CodCliente { get; set; }
        public DateTime DataEmissao { get; set; }
        public DateTime? DataSaida { get; set; }
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
        public Clientes? Cliente { get; set; }
        public CondicaoPagamentos? CondicaoPagamento { get; set; }
        public Transportadores? Transportador { get; set; }
        public List<ProdutosNotaSaida> Produtos { get; set; } = [];
    }
}
