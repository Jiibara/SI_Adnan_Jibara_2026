using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    public class Cidades
    {
        public int CodCidade { get; set; }
        [StringLength(40)]
        public string? Cidade { get; set; }
        [StringLength(4)]
        public string? DDD { get; set; }
        public int CodEstado { get; set; }
        public bool Ativo { get; set; }
        public Estados? Estado { get; set; }
    }
}
