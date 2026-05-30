using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace oProjeto.Server.Models
{
    [Table("Transportadores")]
    public class Transportadores
    {
        [Key] public int CodTransp { get; set; }
        public string? CpfCnpj { get; set; }
        public string? Endereco { get; set; }
        public int CodCidade { get; set; }
        public string? Transportador { get; set; }
        public string? RgInscEst { get; set; }
        public bool Ativo { get; set; }

        [ForeignKey(nameof(CodCidade))] public Cidades? Cidade { get; set; }
        public ICollection<Nfes> Nfes { get; set; } = [];
    }
}
