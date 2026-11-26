using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

using System.ComponentModel.DataAnnotations.Schema;
using oProjeto.Server.Models;

namespace oProjeto.Server.Models
{
    public class Estados
    {
        public int CodEstado { get; set; }
        [StringLength(2)]
        public string? UF { get; set; }
        [StringLength(20)]
        public string? Estado { get; set; }  
        public int CodPais { get; set; }
        public bool Ativo { get; set; }
        public Paises? Pais { get; set; }
    }

}
