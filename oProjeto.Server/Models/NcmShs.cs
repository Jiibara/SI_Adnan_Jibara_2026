using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    public class NcmShs
    {
        [StringLength(10)]
        public string NcmSh { get; set; } = "";  
        public decimal? AliqIcms { get; set; }
        public decimal? AliqIpi { get; set; }
        public bool Ativo { get; set; }
    }

}
