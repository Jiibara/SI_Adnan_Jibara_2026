using System.ComponentModel.DataAnnotations.Schema;

namespace oProjeto.Server.Models
{
    [Table("ProdNfes")]
    public class ProdNfes
    {
        public int Numero { get; set; }
        public int Serie { get; set; }
        public int Modelo { get; set; }
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

        [ForeignKey(nameof(CodProd))] public Produtos? Produto { get; set; }
        public Nfes? Nfe { get; set; }
    }
}
