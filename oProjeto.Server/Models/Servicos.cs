namespace oProjeto.Server.Models
{
    public class Servicos
    {
        public int CodServico { get; set; }
        public string Servico { get; set; }
        public decimal Preco { get; set; }
        public int DuracaoMinutos { get; set; }
        public bool Ativo { get; set; }
    }
}
