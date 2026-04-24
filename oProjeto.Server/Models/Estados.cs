using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Models;

namespace oProjeto.Server.Models
{
    [Table("Estados")]
    public class Estados
    {
        [Key] public int CodEstado { get; set; }
        public string? UF { get; set; }
        public string? Estado { get; set; }  
        public int CodPais { get; set; }

        [ForeignKey(nameof(CodPais))] public Paises? Pais { get; set; }
        public ICollection<Cidades> Cidades { get; set; } = [];
        public ICollection<Veiculos> Veiculos { get; set; } = [];
    }

}
