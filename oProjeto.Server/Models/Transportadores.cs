using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    public class Transportadores
    {
        public int CodTransp { get; set; }
        [StringLength(50)]
        public string? Transportador { get; set; }
        [StringLength(100)]
        public string? NomeFantasia { get; set; } 
        [StringLength(50)]
        public string? Endereco { get; set; }
        [StringLength(50)]
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
        [StringLength(50)]
        public string? Site { get; set; } 
        [StringLength(14)]
        public string? RgInscEst { get; set; }
        // public string? InscEstSubTrib { get; set; }
        [StringLength(14), CpfCnpj]
        public string? CpfCnpj { get; set; }
        [StringLength(2)]
        public string? TipoPessoa { get; set; }
        public int CodCidade { get; set; }
        public int CodVeic { get; set; } 
        public bool Ativo { get; set; }
        public Cidades? Cidade { get; set; }
       public Veiculos? Veiculo { get; set; }
    }
}
