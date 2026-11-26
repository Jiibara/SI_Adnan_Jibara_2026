using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    public class FormaPagamentos
    {
        public int CodFormaPagamento { get; set; }
        [StringLength(20)]
        public string? FormaPagamento { get; set; }
        public bool Ativo { get; set; }
    }
}
