using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    public class CondicaoPagamentos
    {
        public int CodCondicao { get; set; }
        public string? CondicaoPagamento { get; set; }
        public int? NumeroParcelas { get; set; }
        public decimal? PercentualJuros { get; set; }
        public decimal? PercentualMultas { get; set; }
        public decimal? PercentualDesconto { get; set; }
        public bool Ativo { get; set; }
        public List<Parcelas>? Parcelas { get; set; }
    }
}
