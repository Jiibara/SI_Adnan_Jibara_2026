using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Validacoes;

namespace oProjeto.Server.Models
{
    public class Funcoes
    {
        public int CodFuncao { get; set; }
        [StringLength(20)]
        public string Funcao { get; set; }
        public decimal salarioBase { get; set; }
        public bool Ativo { get; set; }
    }
}
