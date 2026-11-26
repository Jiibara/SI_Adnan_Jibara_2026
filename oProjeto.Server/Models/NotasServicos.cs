using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

namespace oProjeto.Server.Models
{
    public class NotasServicos
    {
        [StringLength(2), SomenteDigitos]
        public string Modelo { get; set; }
        [StringLength(3), SomenteDigitos]
        public string Serie { get; set; }
        [StringLength(9), SomenteDigitos]
        public string Numero { get; set; }
        public int CodCliente { get; set; }
        public DateTime DataEmissao { get; set; }
        public decimal ValorServicos { get; set; }
        public decimal ValorDesconto { get; set; }
        public decimal ValorTotal { get; set; }
        public int? CodCondicao { get; set; }
        public string? Observacoes {  get; set; }
        public string Situacao { get; set; }
        public Clientes? Cliente { get; set; }
        public CondicaoPagamentos? CondicaoPagamento { get; set; }
        public List<ServicosNotaServico> Servicos { get; set; } = [];

    }
}
