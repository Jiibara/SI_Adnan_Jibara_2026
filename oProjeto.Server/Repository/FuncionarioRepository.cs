using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class FuncionarioRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Funcionarios>> GetAllAsync()
        {
            var list = new List<Funcionarios>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
            SELECT f.*,
                fn.Funcao, fn.SalarioBase, fn.Ativo AS FuncaoAtivo,
                c.Cidade
            FROM Funcionarios f
            LEFT JOIN Funcoes fn ON fn.CodFuncao = f.CodFuncao
            LEFT JOIN Cidades c ON c.CodCidade = f.CodCidade
            ORDER BY f.CodFunc ASC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }
        public async Task<Funcionarios?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@" SELECT f.*,
                                                             fn.Funcao, fn.SalarioBase, fn.Ativo AS FuncaoAtivo,
                                                             c.Cidade
                                                      FROM Funcionarios f
                                                      LEFT JOIN Funcoes fn ON fn.CodFuncao = f.CodFuncao
                                                      LEFT JOIN Cidades c ON c.CodCidade = f.CodCidade
                                                      WHERE f.CodFunc = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? Map(rd) : null;
        }
        public async Task<Funcionarios> CreateAsync(Funcionarios body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
            INSERT INTO Funcionarios
                (Funcionario, Apelido, Endereco, Numero, Complemento, Bairro,
                 Cep, Fone, Email, CpfCnpj, RgInscEst,
                 DataNascimento, DataAdmissao, DataDemissao,
                 Sexo, Salario, CodFuncao, CodCidade, Ativo)
            VALUES
                (@funcionario, @apelido, @endereco, @numero, @complemento, @bairro,
                 @cep, @fone, @email, @cpfCnpj, @rgInscEst,
                 @dataNascimento, @dataAdmissao, @dataDemissao,
                 @sexo, @salario, @codFuncao, @codCidade, @ativo);
            SELECT LAST_INSERT_ID();", con);
            Params(cmd, body);
            body.CodFunc = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Funcionarios", "CRIOU", $"Criou Funcionário: {body.Funcionario}");
            return body;
        }

        public async Task UpdateAsync(Funcionarios body)
        {
            var antes = await GetByIdAsync(body.CodFunc);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
            UPDATE Funcionarios SET
                Funcionario = @funcionario, Apelido = @apelido, Endereco = @endereco, Numero = @numero, Complemento = @complemento, Bairro = @bairro,Cep = @cep, 
                CodCidade = @codCidade, Fone = @fone, Email = @email, CpfCnpj = @cpfCnpj, RgInscEst = @rgInscEst, TipoPessoa = @tipoPessoa, DataNascimento = @dataNascimento, 
                DataAdmissao = @dataAdmissao, DataDemissao = @dataDemissao, Sexo = @sexo, Salario = @salario, CodFuncao = @codFuncao, Ativo = @ativo
            WHERE CodFunc = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodFunc);
            Params(cmd, body);
            await cmd.ExecuteNonQueryAsync();

            var mudancas = new List<string>();

            if (antes?.Funcionario != body.Funcionario) 
                mudancas.Add($"Funcionário: {body.Funcionario} (Era {antes?.Funcionario})");
            if (antes?.Apelido != body.Apelido) 
                mudancas.Add($"Apelido: {body.Apelido} (Era {antes?.Apelido})");
            if (antes?.CpfCnpj != body.CpfCnpj) 
                mudancas.Add($"CPF/CNPJ: {body.CpfCnpj} (Era {antes?.CpfCnpj})");
            if (antes?.RgInscEst != body.RgInscEst) 
                mudancas.Add($"RG/Insc. Est.: {body.RgInscEst} (Era {antes?.RgInscEst})");
            if (antes?.Endereco != body.Endereco) 
                mudancas.Add($"Endereço: {body.Endereco} (Era {antes?.Endereco})");
            if (antes?.Numero != body.Numero) 
                mudancas.Add($"Número: {body.Numero} (Era {antes?.Numero})");
            if (antes?.Complemento != body.Complemento) 
                mudancas.Add($"Complemento: {body.Complemento} (Era {antes?.Complemento})");
            if (antes?.Bairro != body.Bairro) 
                mudancas.Add($"Bairro: {body.Bairro} (Era {antes?.Bairro})");
            if (antes?.Cep != body.Cep) 
                mudancas.Add($"CEP: {body.Cep} (Era {antes?.Cep})");
            if (antes?.Fone != body.Fone) 
                mudancas.Add($"Telefone: {body.Fone} (Era {antes?.Fone})");
            if (antes?.Email != body.Email) 
                mudancas.Add($"E-mail: {body.Email} (Era {antes?.Email})");
            if (antes?.Sexo != body.Sexo) 
                mudancas.Add($"Sexo: {body.Sexo} (Era {antes?.Sexo})");
            if (antes?.Salario != body.Salario)
                mudancas.Add($"Salário: {body.Salario:C} (Era {antes?.Salario:C})");
            if (antes?.DataNascimento != body.DataNascimento) 
                mudancas.Add($"Nascimento: {body.DataNascimento} (Era {antes?.DataNascimento})");
            if (antes?.DataAdmissao != body.DataAdmissao)
                mudancas.Add($"Admissão: {body.DataAdmissao} (Era {antes?.DataAdmissao})");
            if (antes?.DataDemissao != body.DataDemissao) 
                mudancas.Add($"Demissão: {body.DataDemissao} (Era {antes?.DataDemissao})");
            if (antes?.TipoPessoa != body.TipoPessoa) 
                mudancas.Add($"Tipo Pessoa: {body.TipoPessoa} (Era {antes?.TipoPessoa})");

            if (antes?.CodFuncao != body.CodFuncao)
            {
                var nomeFuncaoNova = await GetNomeFuncaoAsync(con, body.CodFuncao);
                mudancas.Add($"Função: {nomeFuncaoNova} (Era {antes?.Funcao?.Funcao})");
            }

            if (antes?.Ativo != body.Ativo)
                mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Funcionário: {body.Funcionario}"
                : $"Editou Funcionário: {body.Funcionario}. {diff}";

            await log.AddAsync("Funcionarios", "EDITOU", desc);
        }

        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT Funcionario FROM Funcionarios WHERE CodFunc = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Funcionarios WHERE CodFunc = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Funcionarios", "EXCLUIU", $"Excluiu Funcionário: {nome}");
        }

        private static async Task<string> GetNomeFuncaoAsync(MySqlConnection con, int codFuncao)
        {
            await using var cmd = new MySqlCommand("SELECT Funcao FROM Funcoes WHERE CodFuncao = @id", con);
            cmd.Parameters.AddWithValue("@id", codFuncao);
            return (await cmd.ExecuteScalarAsync())?.ToString() ?? codFuncao.ToString();
        }

        static void Params(MySqlCommand cmd, Funcionarios b)
        {
            cmd.Parameters.AddWithValue("@funcionario", b.Funcionario);
            cmd.Parameters.AddWithValue("@apelido", b.Apelido);
            cmd.Parameters.AddWithValue("@endereco", b.Endereco);
            cmd.Parameters.AddWithValue("@numero", b.Numero);
            cmd.Parameters.AddWithValue("@complemento", b.Complemento);
            cmd.Parameters.AddWithValue("@bairro", b.Bairro);
            cmd.Parameters.AddWithValue("@cep", b.Cep);
            cmd.Parameters.AddWithValue("@codCidade", b.CodCidade);
            cmd.Parameters.AddWithValue("@fone", b.Fone);
            cmd.Parameters.AddWithValue("@email", b.Email);
            cmd.Parameters.AddWithValue("@cpfCnpj", b.CpfCnpj);
            cmd.Parameters.AddWithValue("@rgInscEst", b.RgInscEst);
            cmd.Parameters.AddWithValue("@dataNascimento", b.DataNascimento.HasValue ? b.DataNascimento : DBNull.Value);
            cmd.Parameters.AddWithValue("@dataAdmissao", b.DataAdmissao.HasValue ? b.DataAdmissao : DBNull.Value);
            cmd.Parameters.AddWithValue("@dataDemissao", b.DataDemissao.HasValue ? b.DataDemissao : DBNull.Value);
            cmd.Parameters.AddWithValue("@sexo", b.Sexo);
            cmd.Parameters.AddWithValue("@salario", b.Salario);
            cmd.Parameters.AddWithValue("@tipoPessoa", b.TipoPessoa);
            cmd.Parameters.AddWithValue("@codFuncao", b.CodFuncao);
            cmd.Parameters.AddWithValue("@ativo", b.Ativo);
        }

        static Funcionarios Map(MySqlDataReader rd) => new()
        {
            CodFunc = rd.GetInt32("CodFunc"),
            Funcionario = rd.IsDBNull(rd.GetOrdinal("Funcionario")) ? null : rd.GetString("Funcionario"),
            Apelido = rd.IsDBNull(rd.GetOrdinal("Apelido")) ? null : rd.GetString("Apelido"),
            Endereco = rd.IsDBNull(rd.GetOrdinal("Endereco")) ? null : rd.GetString("Endereco"),
            Numero = rd.IsDBNull(rd.GetOrdinal("Numero")) ? 0 : rd.GetInt32("Numero"),
            Complemento = rd.IsDBNull(rd.GetOrdinal("Complemento")) ? null : rd.GetString("Complemento"),
            Bairro = rd.IsDBNull(rd.GetOrdinal("Bairro")) ? null : rd.GetString("Bairro"),
            Cep = rd.IsDBNull(rd.GetOrdinal("Cep")) ? null : rd.GetString("Cep"),
            Fone = rd.IsDBNull(rd.GetOrdinal("Fone")) ? null : rd.GetString("Fone"),
            Email = rd.IsDBNull(rd.GetOrdinal("Email")) ? null : rd.GetString("Email"),
            CpfCnpj = rd.IsDBNull(rd.GetOrdinal("CpfCnpj")) ? null : rd.GetString("CpfCnpj"),
            RgInscEst = rd.IsDBNull(rd.GetOrdinal("RgInscEst")) ? null : rd.GetString("RgInscEst"),
            DataNascimento = rd.IsDBNull(rd.GetOrdinal("DataNascimento")) ? null : DateOnly.FromDateTime(rd.GetDateTime("DataNascimento")),
            DataAdmissao = rd.IsDBNull(rd.GetOrdinal("DataAdmissao")) ? null : DateOnly.FromDateTime(rd.GetDateTime("DataAdmissao")),
            DataDemissao = rd.IsDBNull(rd.GetOrdinal("DataDemissao")) ? null : DateOnly.FromDateTime(rd.GetDateTime("DataDemissao")),
            Sexo = rd.IsDBNull(rd.GetOrdinal("Sexo")) ? '\0' : rd.GetChar("Sexo"),
            Salario = rd.IsDBNull(rd.GetOrdinal("Salario")) ? 0 : rd.GetDecimal("Salario"),
            TipoPessoa = rd.IsDBNull(rd.GetOrdinal("TipoPessoa")) ? null : rd.GetString("TipoPessoa"),
            CodFuncao = rd.IsDBNull(rd.GetOrdinal("CodFuncao")) ? 0 : rd.GetInt32("CodFuncao"),
            Ativo = rd.GetBoolean("Ativo"),
            Funcao = rd.IsDBNull(rd.GetOrdinal("CodFuncao")) ? null : new Funcoes
            {
                CodFuncao = rd.GetInt32("CodFuncao"),
                Funcao = rd.IsDBNull(rd.GetOrdinal("Funcao")) ? null : rd.GetString("Funcao"),
                salarioBase = rd.IsDBNull(rd.GetOrdinal("SalarioBase")) ? 0 : rd.GetDecimal("SalarioBase"),
                Ativo = rd.IsDBNull(rd.GetOrdinal("FuncaoAtivo")) ? false : rd.GetBoolean("FuncaoAtivo"),
            },
            CodCidade = rd.IsDBNull(rd.GetOrdinal("CodCidade")) ? 0 : rd.GetInt32("CodCidade"),
            Cidade = rd.IsDBNull(rd.GetOrdinal("CodCidade")) ? null : new Cidades
            {
                CodCidade = rd.GetInt32("CodCidade"),
                Cidade = rd.IsDBNull(rd.GetOrdinal("Cidade")) ? null : rd.GetString("Cidade"),
            },
        };
    }
}
