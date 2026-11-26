using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

namespace oProjeto.Server.Models
{
    public class Marcas
    {
        public int CodMarca { get; set; }
        [StringLength(20)]
        public string? Marca { get; set; }
        public bool Ativo { get; set; }
    }
}
