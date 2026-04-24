using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace oProjeto.Server.Models
{
    [Table("Cidades")]
    public class Cidades
    {
        [Key] public int CodCidade { get; set; }
        public string? Cidade { get; set; }  
        public int CodEstado { get; set; }

        [ForeignKey(nameof(CodEstado))] public Estados? Estado { get; set; }
        public ICollection<Fornecedores> Fornecedores { get; set; } = [];
        public ICollection<Transportadores> Transportadores { get; set; } = [];
    }
}
