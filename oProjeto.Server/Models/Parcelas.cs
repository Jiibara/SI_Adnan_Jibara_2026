using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    [Table("Parcelas")]

    public class Parcelas
    {
        [Key] public int CodParcela { get; set; }
        public int NumeroParcela { get; set; }
        public decimal Percentual { get; set; }
        public int Dias { get; set; }
        public int CodCondicao { get; set; }
        public int CodFormaPagamento { get; set; }
        [ForeignKey(nameof(CodCondicao))] public CondicaoPagamentos? CondicaoPagamento { get; set; }
        [ForeignKey(nameof(CodFormaPagamento))] public FormaPagamentos? FormaPagamento { get; set; }

    }
}
