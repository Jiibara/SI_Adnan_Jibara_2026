using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    public class ProdNfes
    {
        public string Numero { get; set; }
        public string Serie { get; set; }
        public string Modelo { get; set; }
        public int CodForn { get; set; }

        public int CodProd { get; set; }
        public string? CSOSN { get; set; }
        public string? CFOP { get; set; }
        public decimal? Quantidade { get; set; }
        public decimal? ValorUnitario { get; set; }
        public decimal? Desconto { get; set; }
        public decimal? ValorIcms { get; set; }
        public decimal? ValorIpi { get; set; }
        public decimal? AliqIcms { get; set; }
        public decimal? AliqIpi { get; set; }
        public decimal? BaseCalcIcms { get; set; }

        public Produtos? Produto { get; set; }
        public Nfes? Nfe { get; set; }
    }
}