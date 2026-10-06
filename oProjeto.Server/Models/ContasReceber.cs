using System.Data;

namespace oProjeto.Server.Models
{
    public class ContasReceber
    {
        public string NotaNumero { get; set; }
        public string NotaModelo { get; set; }
        public string NotaSerie { get; set; }
        public int CodCliente { get; set; }
        public int NumeroParcela { get; set; }
        public int TotalParcelas { get; set; }
        public decimal ValorOriginal { get; set; }
        public decimal ValorRecebido { get; set; }
        public decimal ValorDesconto { get; set; }
        public decimal ValorJuros { get; set; }
        public decimal ValorMulta { get; set; }
        public decimal PercentualJuros { get; set; }
        public decimal PercentualMulta { get; set; }
        public decimal PercentualDesconto { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DataEmissao { get; set; }
        public DateTime DataVencimento { get; set; }
        public DateTime? DataRecebimento { get; set; }
        public int? CodFormaPagamento { get; set; }
        public string Situacao { get; set; } = "PENDENTE";
        public string? Observacoes { get; set; }
        public Clientes? Cliente { get; set; }
    }
}
