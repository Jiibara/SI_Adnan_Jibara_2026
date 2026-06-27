using MySqlConnector;
using oProjeto.Server.Models;
using oProjeto.Server.Repository;

public class ClienteRepository(IConfiguration cfg, LogRepository log)
{
    private MySqlConnection Conn() =>
        new(cfg.GetConnectionString("DefaultConnection"));

    public async Task<IEnumerable<Clientes>> GetAllAsync()
    {
        var list = new List<Clientes>();
        await using var con = Conn();
        await con.OpenAsync();
        await using var cmd = new MySqlCommand(@"
            SELECT c.*,
                   ci.Cidade, ci.CodEstado, ci.Ativo AS CidadeAtivo,
                   e.UF, e.Estado, e.CodPais, e.Ativo AS EstadoAtivo,
                   cp.CondicaoPagamento
            FROM Clientes c
            LEFT JOIN Cidades            ci ON ci.CodCidade   = c.CodCidade
            LEFT JOIN Estados            e  ON e.CodEstado    = ci.CodEstado
            LEFT JOIN CondicaoPagamentos cp ON cp.CodCondicao = c.CodCondicao
            ORDER BY c.CodCliente ASC", con);
        await using var rd = await cmd.ExecuteReaderAsync();
        while (await rd.ReadAsync())
            list.Add(Map(rd));
        return list;
    }

    public async Task<Clientes?> GetByIdAsync(int id)
    {
        await using var con = Conn();
        await con.OpenAsync();
        await using var cmd = new MySqlCommand(@"
            SELECT c.*,
                   ci.Cidade, ci.CodEstado, ci.Ativo AS CidadeAtivo,
                   e.UF, e.Estado, e.CodPais, e.Ativo AS EstadoAtivo,
                   cp.CondicaoPagamento
            FROM Clientes c
            LEFT JOIN Cidades            ci ON ci.CodCidade   = c.CodCidade
            LEFT JOIN Estados            e  ON e.CodEstado    = ci.CodEstado
            LEFT JOIN CondicaoPagamentos cp ON cp.CodCondicao = c.CodCondicao
            WHERE c.CodCliente = @id", con);
        cmd.Parameters.AddWithValue("@id", id);
        await using var rd = await cmd.ExecuteReaderAsync();
        return await rd.ReadAsync() ? Map(rd) : null;
    }

    public async Task<Clientes> CreateAsync(Clientes body)
    {
        await using var con = Conn();
        await con.OpenAsync();
        await using var cmd = new MySqlCommand(@"
            INSERT INTO Clientes
                (Cliente, Apelido, Endereco, Bairro, Numero, Complemento,
                 Cep, CodCidade, Fone, Email, CodCondicao, CpfCnpj,
                 RgInscEst, TipoPessoa, DataNascimento, Sexo, LimiteCredito, Ativo)
            VALUES
                (@cliente, @apelido, @endereco, @bairro, @numero, @complemento,
                 @cep, @codCidade, @fone, @email, @codCondicao, @cpfCnpj,
                 @rgInscEst, @tipoPessoa, @dataNascimento, @sexo, @limiteCredito, @ativo);
            SELECT LAST_INSERT_ID();", con);
        Params(cmd, body);
        body.CodCliente = Convert.ToInt32(await cmd.ExecuteScalarAsync());

        await log.AddAsync("Clientes", "CRIOU", $"Criou Cliente: {body.Cliente}");
        return body;
    }

    public async Task UpdateAsync(Clientes body)
    {
        var antes = await GetByIdAsync(body.CodCliente);

        await using var con = Conn();
        await con.OpenAsync();
        await using var cmd = new MySqlCommand(@"
            UPDATE Clientes SET
                Cliente = @cliente, Apelido = @apelido, Endereco = @endereco, Bairro = @bairro, Numero = @numero, Complemento = @complemento,Cep = @cep, 
                CodCidade = @codCidade, Fone = @fone, Email = @email, CodCondicao = @codCondicao, CpfCnpj = @cpfCnpj, RgInscEst = @rgInscEst, 
                TipoPessoa = @tipoPessoa, DataNascimento = @dataNascimento, Sexo = @sexo, LimiteCredito  = @limiteCredito, Ativo = @ativo
            WHERE CodCliente = @id", con);
        cmd.Parameters.AddWithValue("@id", body.CodCliente);
        Params(cmd, body);
        await cmd.ExecuteNonQueryAsync();

        var mudancas = new List<string>();

        if (antes?.Cliente != body.Cliente) 
            mudancas.Add($"Cliente: {body.Cliente} (Era {antes?.Cliente})");
        if (antes?.Apelido != body.Apelido) 
            mudancas.Add($"Apelido: {body.Apelido} (Era {antes?.Apelido})");
        if (antes?.CpfCnpj != body.CpfCnpj) 
            mudancas.Add($"CPF/CNPJ: {body.CpfCnpj} (Era {antes?.CpfCnpj})");
        if (antes?.RgInscEst != body.RgInscEst)
            mudancas.Add($"RG/Insc. Est.: {body.RgInscEst} (Era {antes?.RgInscEst})");
        if (antes?.TipoPessoa != body.TipoPessoa) 
            mudancas.Add($"Tipo Pessoa: {body.TipoPessoa} (Era {antes?.TipoPessoa})");
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
        if (antes?.LimiteCredito != body.LimiteCredito) 
            mudancas.Add($"Limite de Crédito: {body.LimiteCredito:C} (Era {antes?.LimiteCredito:C})");
        if (antes?.DataNascimento != body.DataNascimento)
            mudancas.Add($"Nascimento: {body.DataNascimento} (Era {antes?.DataNascimento})");

        if (antes?.CodCidade != body.CodCidade)
        {
            var nomeCidadeNova = await GetNomeCidadeAsync(con, body.CodCidade);
            mudancas.Add($"Cidade: {nomeCidadeNova} (Era {antes?.Cidade?.Cidade})");
        }

        if (antes?.CodCondicao != body.CodCondicao)
        {
            var nomeCondicaoNova = await GetNomeCondicaoAsync(con, body.CodCondicao);
            mudancas.Add($"Condição: {nomeCondicaoNova} (Era {antes?.Condicao?.CondicaoPagamento})");
        }

        if (antes?.Ativo != body.Ativo)
            mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

        var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
        var desc = string.IsNullOrEmpty(diff)
            ? $"Editou Cliente: {body.Cliente}"
            : $"Editou Cliente: {body.Cliente}. {diff}";

        await log.AddAsync("Clientes", "EDITOU", desc);
    }

    public async Task DeleteAsync(int id)
    {
        await using var con = Conn();
        await con.OpenAsync();

        string nome;
        await using (var sel = new MySqlCommand("SELECT Cliente FROM Clientes WHERE CodCliente = @id", con))
        {
            sel.Parameters.AddWithValue("@id", id);
            nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
        }

        await using var cmd = new MySqlCommand("DELETE FROM Clientes WHERE CodCliente = @id", con);
        cmd.Parameters.AddWithValue("@id", id);
        await cmd.ExecuteNonQueryAsync();

        await log.AddAsync("Clientes", "EXCLUIU", $"Excluiu Cliente: {nome}");
    }

    private static async Task<string> GetNomeCidadeAsync(MySqlConnection con, int codCidade)
    {
        await using var cmd = new MySqlCommand("SELECT Cidade FROM Cidades WHERE CodCidade = @id", con);
        cmd.Parameters.AddWithValue("@id", codCidade);
        return (await cmd.ExecuteScalarAsync())?.ToString() ?? codCidade.ToString();
    }

    private static async Task<string> GetNomeCondicaoAsync(MySqlConnection con, int codCondicao)
    {
        await using var cmd = new MySqlCommand("SELECT CondicaoPagamento FROM CondicaoPagamentos WHERE CodCondicao = @id", con);
        cmd.Parameters.AddWithValue("@id", codCondicao);
        return (await cmd.ExecuteScalarAsync())?.ToString() ?? codCondicao.ToString();
    }

    static void Params(MySqlCommand cmd, Clientes b)
    {
        cmd.Parameters.AddWithValue("@cliente", b.Cliente);
        cmd.Parameters.AddWithValue("@apelido", b.Apelido);
        cmd.Parameters.AddWithValue("@endereco", b.Endereco);
        cmd.Parameters.AddWithValue("@bairro", b.Bairro);
        cmd.Parameters.AddWithValue("@numero", b.Numero);
        cmd.Parameters.AddWithValue("@complemento", b.Complemento);
        cmd.Parameters.AddWithValue("@cep", b.Cep);
        cmd.Parameters.AddWithValue("@codCidade", b.CodCidade);
        cmd.Parameters.AddWithValue("@fone", b.Fone);
        cmd.Parameters.AddWithValue("@email", b.Email);
        cmd.Parameters.AddWithValue("@codCondicao", b.CodCondicao);
        cmd.Parameters.AddWithValue("@cpfCnpj", b.CpfCnpj);
        cmd.Parameters.AddWithValue("@rgInscEst", b.RgInscEst);
        cmd.Parameters.AddWithValue("@tipoPessoa", b.TipoPessoa);
        cmd.Parameters.AddWithValue("@dataNascimento", b.DataNascimento);
        cmd.Parameters.AddWithValue("@sexo", b.Sexo);
        cmd.Parameters.AddWithValue("@limiteCredito", b.LimiteCredito);
        cmd.Parameters.AddWithValue("@ativo", b.Ativo);
    }

    static Clientes Map(MySqlDataReader rd) => new()
    {
        CodCliente = rd.GetInt32("CodCliente"),
        Cliente = rd.IsDBNull(rd.GetOrdinal("Cliente")) ? null : rd.GetString("Cliente"),
        Apelido = rd.IsDBNull(rd.GetOrdinal("Apelido")) ? null : rd.GetString("Apelido"),
        Endereco = rd.IsDBNull(rd.GetOrdinal("Endereco")) ? null : rd.GetString("Endereco"),
        Bairro = rd.IsDBNull(rd.GetOrdinal("Bairro")) ? null : rd.GetString("Bairro"),
        Numero = rd.IsDBNull(rd.GetOrdinal("Numero")) ? null : rd.GetInt32("Numero"),
        Complemento = rd.IsDBNull(rd.GetOrdinal("Complemento")) ? null : rd.GetString("Complemento"),
        Cep = rd.IsDBNull(rd.GetOrdinal("Cep")) ? null : rd.GetString("Cep"),
        CodCidade = rd.IsDBNull(rd.GetOrdinal("CodCidade")) ? 0 : rd.GetInt32("CodCidade"),
        Fone = rd.IsDBNull(rd.GetOrdinal("Fone")) ? null : rd.GetString("Fone"),
        Email = rd.IsDBNull(rd.GetOrdinal("Email")) ? null : rd.GetString("Email"),
        CodCondicao = rd.IsDBNull(rd.GetOrdinal("CodCondicao")) ? 0 : rd.GetInt32("CodCondicao"),
        CpfCnpj = rd.IsDBNull(rd.GetOrdinal("CpfCnpj")) ? null : rd.GetString("CpfCnpj"),
        RgInscEst = rd.IsDBNull(rd.GetOrdinal("RgInscEst")) ? null : rd.GetString("RgInscEst"),
        TipoPessoa = rd.IsDBNull(rd.GetOrdinal("TipoPessoa")) ? null : rd.GetString("TipoPessoa"),
        DataNascimento = rd.IsDBNull(rd.GetOrdinal("DataNascimento")) ? null : DateOnly.FromDateTime(rd.GetDateTime("DataNascimento")),
        Sexo = rd.IsDBNull(rd.GetOrdinal("Sexo")) ? null : rd.GetChar("Sexo"),
        LimiteCredito = rd.IsDBNull(rd.GetOrdinal("LimiteCredito")) ? null : rd.GetInt32("LimiteCredito"),
        Ativo = rd.GetBoolean("Ativo"),
        Cidade = rd.IsDBNull(rd.GetOrdinal("CodCidade")) ? null : new Cidades
        {
            CodCidade = rd.GetInt32("CodCidade"),
            Cidade = rd.IsDBNull(rd.GetOrdinal("Cidade")) ? null : rd.GetString("Cidade"),
            CodEstado = rd.IsDBNull(rd.GetOrdinal("CodEstado")) ? 0 : rd.GetInt32("CodEstado"),
            Ativo = rd.IsDBNull(rd.GetOrdinal("CidadeAtivo")) ? false : rd.GetBoolean("CidadeAtivo"),
            Estado = new Estados
            {
                CodEstado = rd.IsDBNull(rd.GetOrdinal("CodEstado")) ? 0 : rd.GetInt32("CodEstado"),
                UF = rd.IsDBNull(rd.GetOrdinal("UF")) ? null : rd.GetString("UF"),
                Estado = rd.IsDBNull(rd.GetOrdinal("Estado")) ? null : rd.GetString("Estado"),
                CodPais = rd.IsDBNull(rd.GetOrdinal("CodPais")) ? 0 : rd.GetInt32("CodPais"),
                Ativo = rd.IsDBNull(rd.GetOrdinal("EstadoAtivo")) ? false : rd.GetBoolean("EstadoAtivo"),
            }
        },
        Condicao = rd.IsDBNull(rd.GetOrdinal("CodCondicao")) ? null : new CondicaoPagamentos
        {
            CodCondicao = rd.GetInt32("CodCondicao"),
            CondicaoPagamento = rd.IsDBNull(rd.GetOrdinal("CondicaoPagamento")) ? null : rd.GetString("CondicaoPagamento"),
        }
    };
}