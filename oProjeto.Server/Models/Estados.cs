using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Models;

namespace oProjeto.Server.Models
{
    public class Estados
    {
        public int CodEstado { get; set; }
        public string? UF { get; set; }
        public string? Estado { get; set; }  
        public int CodPais { get; set; }
        public bool Ativo { get; set; }
        public Paises? Pais { get; set; }
    }

}
