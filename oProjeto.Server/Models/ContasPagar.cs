using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using oProjeto.Server.Models;

namespace oProjeto.Server.Models
{
    public class ContasPagar
    {
        public int Numero { get; set; }
        public int Serie { get; set; }
        public int Modelo { get; set; }
        public int CodForn { get; set; }
        public int NumeroParcela { get; set; }
        public bool Ativo { get; set; }
        public decimal? ValorParcela { get; set; }
        public DateOnly? VencimentoParcela { get; set; }
        public Fornecedores? Fornecedor { get; set; }
        public Nfes? Nfe { get; set; }
    }
}