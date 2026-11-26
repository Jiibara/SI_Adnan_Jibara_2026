using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

namespace oProjeto.Server.Models
{
    public class Clientes
    {
        public int CodCliente { get; set; }
        [StringLength(50)]
        public string? Cliente { get; set; }
        [StringLength(50)]
        public string? Apelido { get; set; }
        [StringLength(50)]
        public string? Endereco { get; set; }
        [StringLength(25)]
        public string? Bairro { get; set; }
        [Range(0, 999999)]
        public int? Numero { get; set; }
        [StringLength(25)]
        public string? Complemento { get; set; }
        [StringLength(8), SomenteDigitos]
        public string? Cep { get; set; }
        public int CodCidade { get; set; }
        [StringLength(15)]
        public string? Fone { get; set; }
        [StringLength(30)]
        public string? Email { get; set; }
        public int CodCondicao { get; set; }
        [StringLength(14), CpfCnpj]
        public string? CpfCnpj { get; set; }
        [StringLength(13)]
        public string? RgInscEst { get; set; }
        [StringLength(2)]
        public string? TipoPessoa { get; set; }
        public DateOnly? DataNascimento { get; set; }
        public char? Sexo { get; set; }
        public int? LimiteCredito { get; set; }
        public bool Ativo { get; set; }
        public Cidades? Cidade { get; set; }
        public CondicaoPagamentos? Condicao { get; set; }
    }
}