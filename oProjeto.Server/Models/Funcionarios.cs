using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

namespace oProjeto.Server.Models
{
    public class Funcionarios
    {
        public int CodFunc { get; set; }
        [StringLength(50)]
        public string? Funcionario { get; set; }
        [StringLength(50)]
        public string? Apelido { get; set; } 
        [StringLength(50)]
        public string? Endereco { get; set; }
        [StringLength(25)]
        public string? Bairro { get; set; }
        [Range(0, 999999)]
        public int Numero { get; set; } 
        [StringLength(25)]
        public string? Complemento { get; set; } 
        [StringLength(8), SomenteDigitos]
        public string? Cep { get; set; }
        [StringLength(15)]
        public string? Fone { get; set; }
        [StringLength(30)]
        public string? Email { get; set; }
        [StringLength(14), CpfCnpj]
        public string? CpfCnpj { get; set; }
        [StringLength(13)]
        public string? RgInscEst { get; set; }
        [StringLength(2)]
        public string? TipoPessoa { get; set; }
        public DateOnly? DataNascimento {  get; set; }
        public DateOnly? DataAdmissao { get; set; }
        public DateOnly? DataDemissao { get; set; }
        public char Sexo { get; set; }
        public decimal Salario { get; set; }
        public int CodFuncao { get; set; }
        public int CodCidade { get; set; }
        public Funcoes? Funcao { get; set; }
        public Cidades? Cidade { get; set; }
        public bool Ativo { get; set; }

    }
}
