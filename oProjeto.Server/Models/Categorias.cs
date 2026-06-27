using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace oProjeto.Server.Models
{
    public class Categorias
    {
        public int CodCategoria { get; set; }
        public string? Categoria { get; set; }
        public bool Ativo { get; set; }
    }
}
