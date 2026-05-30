using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace oProjeto.Server.Models
{
    [Table("NcmShs")]
    public class NcmShs
    {
        [Key] public string NcmSh { get; set; } = "";  
        public decimal? AliqIcms { get; set; }
        public decimal? AliqIpi { get; set; }
        public bool Ativo { get; set; }
        public ICollection<Produtos> Produtos { get; set; } = [];
    }

}
