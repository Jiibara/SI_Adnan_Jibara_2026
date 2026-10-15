namespace oProjeto.Server.DTOs
{
    public class PagarContaRequest
    {
        public decimal ValorDesconto { get; set; }
        public decimal ValorJuros { get; set; }
        public decimal ValorMulta { get; set; }
        public DateTime? DataPagamento { get; set; }
        public int? CodFormaPagamento { get; set; }
    }
}