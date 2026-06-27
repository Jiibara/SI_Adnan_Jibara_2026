namespace oProjeto.Server.Models
{
    public class Fornecedores
    {
        public int CodForn { get; set; }
        public string? Fornecedor { get; set; }
        public string? NomeFantasia { get; set; }
        public string? Endereco { get; set; }
        public string? Bairro { get; set; }
        public int Numero { get; set; }
        public string? Complemento { get; set; }
        public string? Cep { get; set; }
        public string? Fone { get; set; }
        public string? Email { get; set; }
        public string? Site { get; set; }
        public string? RgInscEst { get; set; }
        public string? InscEstSubTrib { get; set; }
        public string? CpfCnpj { get; set; }
        public string? TipoPessoa { get; set; }
        public int CodCidade { get; set; }
        public int CodCondicao { get; set; }
        public bool Ativo { get; set; }
        public Cidades? Cidade { get; set; }
        public CondicaoPagamentos? Condicao { get; set; }
        // Falta Nfe
    }
}