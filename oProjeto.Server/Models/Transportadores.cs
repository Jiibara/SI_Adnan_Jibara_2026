using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace oProjeto.Server.Models
{
    public class Transportadores
    {
        public int CodTransp { get; set; }
        public string? Transportador { get; set; }
        public string? NomeFantasia { get; set; } // novo
        public string? Endereco { get; set; }
        public string? Bairro { get; set; }
        public int Numero { get; set; } // novo
        public string? Complemento { get; set; } // novo
        public string? Cep { get; set; }
        public string? Fone { get; set; }
        public string? Email { get; set; }
        public string? Site { get; set; } // novo
        public string? RgInscEst { get; set; }
        // public string? InscEstSubTrib { get; set; }
        public string? CpfCnpj { get; set; }
        public string? TipoPessoa { get; set; }
        public int CodCidade { get; set; }
        public int CodVeic { get; set; } // novo
        public bool Ativo { get; set; }
        public Cidades? Cidade { get; set; }
       public Veiculos? Veiculo { get; set; }
    }
}
