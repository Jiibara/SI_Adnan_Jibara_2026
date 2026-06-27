namespace oProjeto.Server.Models
{
    public class Funcionarios
    {
        public int CodFunc { get; set; }
        public string? Funcionario { get; set; }
        public string? Apelido { get; set; } 
        public string? Endereco { get; set; }
        public string? Bairro { get; set; }
        public int Numero { get; set; } 
        public string? Complemento { get; set; } 
        public string? Cep { get; set; }
        public string? Fone { get; set; }
        public string? Email { get; set; }
        public string? CpfCnpj { get; set; }
        public string? RgInscEst { get; set; }
        public string? TipoPessoa { get; set; }
        public DateOnly? DataNascimento {  get; set; }
        public DateOnly? DataAdmissao { get; set; }
        public DateOnly? DataDemissao { get; set; }
        public char Sexo { get; set; }
        public decimal Salario { get; set; }
        public int CodFuncao { get; set; }
        public int CodCidade { get; set; }
        public Funcoes? Funcao { get; set; }
        public Cidades? Cidade { get; set; }
        public bool Ativo { get; set; }

    }
}
