namespace oProjeto.Server.Models
{
    public class Clientes
    {
        public int CodCliente { get; set; }
        public string? Cliente { get; set; }
        public string? Apelido { get; set; }
        public string? Endereco { get; set; }
        public string? Bairro { get; set; }
        public int? Numero { get; set; }
        public string? Complemento { get; set; }
        public string? Cep { get; set; }
        public int CodCidade { get; set; }
        public string? Fone { get; set; }
        public string? Email { get; set; }
        public int CodCondicao { get; set; }
        public string? CpfCnpj { get; set; }
        public string? RgInscEst { get; set; }
        public string? TipoPessoa { get; set; }
        public DateOnly? DataNascimento { get; set; }
        public char? Sexo { get; set; }
        public int? LimiteCredito { get; set; }
        public bool Ativo { get; set; }
        public Cidades? Cidade { get; set; }
        public CondicaoPagamentos? Condicao { get; set; }
    }
}