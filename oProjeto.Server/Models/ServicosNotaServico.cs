namespace oProjeto.Server.Models
{
    public class ServicosNotaServico
    {
        public string Numero { get; set; }
        public string Modelo { get; set; }
        public string Serie { get; set; }
        public int CodCliente { get; set; }
        public int CodServico { get; set; }
        public int Quantidade { get; set; }
        public decimal ValorUnitario { get; set; }
        public decimal ValorTotal { get; set; }
        public decimal DescontoPercentual { get; set; }
        public decimal DescontoValor { get; set; }
        public Servicos? Servico { get; set; }
    }
}
