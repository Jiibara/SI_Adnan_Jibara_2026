namespace oProjeto.Server.DTOs
{
    public class ReceberContaRequest
    {
        public decimal ValorDesconto { get; set; }
        public decimal ValorJuros { get; set; }
        public decimal ValorMulta { get; set; }
        public DateTime? DataRecebimento { get; set; }
        public int? CodFormaPagamento { get; set; }
    }
}