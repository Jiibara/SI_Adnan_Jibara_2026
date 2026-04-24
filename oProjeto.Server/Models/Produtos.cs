using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace oProjeto.Server.Models
{
    public class Produtos
    {
        [Key] public int CodProd { get; set; }
        public string Produto { get; set; }
        public string NcmSh { get; set; }
        public string Unidade { get; set; }
        public decimal PesoBruto { get; set; }
        public decimal PesoLiq { get; set; }
        public decimal Saldo { get; set; }
        public decimal CustoMedio { get; set; }

        [ForeignKey(nameof(NcmSh))] public NcmShs? NcmShs { get; set; }
        public ICollection<ProdNfes> ProdNfes { get; set; } = [];
    }
}

