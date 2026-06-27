using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace oProjeto.Server.Models
{
    public class Produtos
    {
        public int CodProd { get; set; }
        public string Produto { get; set; }
        public string Unidade { get; set; }
        //public string NcmSh { get; set; }
        public decimal PesoBruto { get; set; }
        public decimal PesoLiq { get; set; }
        public decimal Saldo { get; set; }
        public decimal PrecoCompra { get; set; }
        public decimal PrecoVenda { get; set; }
        public decimal CustoMedio { get; set; }
        public int CodCategoria { get; set; }
        public int CodMarca { get; set; }
        public bool Ativo { get; set; }
        //public NcmShs? NcmShs { get; set; }
        public Categorias? Categoria { get; set; }
        public Marcas? Marca { get; set; }
    }
}

