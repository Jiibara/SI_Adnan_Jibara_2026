using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    [Table("formaPagamentos")]
    public class FormaPagamentos
    {
        [Key] public int CodFormaPagamento { get; set; }
        public string? FormaPagamento { get; set; }
    }
}
