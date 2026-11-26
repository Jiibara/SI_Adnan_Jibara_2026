using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    public class Categorias
    {
        public int CodCategoria { get; set; }
        [StringLength(20)]
        public string? Categoria { get; set; }
        public bool Ativo { get; set; }
    }
}
