using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    public class FormaPagamentos
    {
        public int CodFormaPagamento { get; set; }
        public string? FormaPagamento { get; set; }
        public bool Ativo { get; set; }
    }
}
