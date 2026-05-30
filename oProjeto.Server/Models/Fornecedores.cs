using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace oProjeto.Server.Models
{
    [Table("Fornecedores")]
    public class Fornecedores
    {
        [Key] public int CodForn { get; set; }
        public string? Fornecedor { get; set; }
        public string? Endereco { get; set; }
        public string? Bairro { get; set; }
        public int CodCidade { get; set; }
        public string? Cep { get; set; }
        public string? Fone { get; set; }
        public string? Email { get; set; }
        public string? RgInscEst { get; set; }
        public string? InscEstSubTrib { get; set; }
        public string? CpfCnpj { get; set; }
        public bool Ativo { get; set; }

        [ForeignKey(nameof(CodCidade))] public Cidades? Cidade { get; set; }
        public ICollection<Nfes> Nfes { get; set; } = [];
    }
}
