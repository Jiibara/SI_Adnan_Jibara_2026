using oProjeto.Server.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    public class Parcelas
    {
        public int CodCondicao { get; set; }
        public int NumeroParcela { get; set; }
        public decimal Percentual { get; set; }
        public int Dias { get; set; }
        public int CodFormaPagamento { get; set; }
        public CondicaoPagamentos? CondicaoPagamento { get; set; }  
        public FormaPagamentos? FormaPagamento { get; set; }
    }
}