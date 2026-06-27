using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class FornecedorRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Fornecedores>> GetAllAsync()
        {
            var list = new List<Fornecedores>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT f.*,
                       c.Cidade, c.CodEstado, c.Ativo AS CidadeAtivo,
                       e.UF, e.Estado, e.CodPais, e.Ativo AS EstadoAtivo,
                       cp.CondicaoPagamento
                FROM Fornecedores f
                LEFT JOIN Cidades            c  ON c.CodCidade   = f.CodCidade
                LEFT JOIN Estados            e  ON e.CodEstado   = c.CodEstado
                LEFT JOIN CondicaoPagamentos cp ON cp.CodCondicao = f.CodCondicao
                ORDER BY f.CodForn ASC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }

        public async Task<Fornecedores?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT f.*,
                       c.Cidade, c.CodEstado, c.Ativo AS CidadeAtivo,
                       e.UF, e.Estado, e.CodPais, e.Ativo AS EstadoAtivo,
                       cp.CondicaoPagamento
                FROM Fornecedores f
                LEFT JOIN Cidades            c  ON c.CodCidade   = f.CodCidade
                LEFT JOIN Estados            e  ON e.CodEstado   = c.CodEstado
                LEFT JOIN CondicaoPagamentos cp ON cp.CodCondicao = f.CodCondicao
                WHERE f.CodForn = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? Map(rd) : null;
        }

        public async Task<Fornecedores> CreateAsync(Fornecedores body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO Fornecedores
                    (Fornecedor, NomeFantasia, Endereco, Numero, Complemento, Bairro,
                     CodCidade, Cep, Fone, Email, Site, RgInscEst, InscEstSubTrib,
                     CpfCnpj, TipoPessoa, CodCondicao, Ativo)
                VALUES
                    (@fornecedor, @nomeFantasia, @endereco, @numero, @complemento, @bairro,
                     @codCidade, @cep, @fone, @email, @site, @rgInscEst, @inscEstSubTrib,
                     @cpfCnpj, @tipoPessoa, @codCondicao, @ativo);
                SELECT LAST_INSERT_ID();", con);
            Params(cmd, body);
            body.CodForn = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Fornecedores", "CRIOU", $"Criou Fornecedor: {body.Fornecedor}");
            return body;
        }

        public async Task UpdateAsync(Fornecedores body)
        {
            var antes = await GetByIdAsync(body.CodForn);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                UPDATE Fornecedores SET
                    Fornecedor     = @fornecedor,     NomeFantasia   = @nomeFantasia,
                    Endereco       = @endereco,       Numero         = @numero,
                    Complemento    = @complemento,    Bairro         = @bairro,
                    CodCidade      = @codCidade,      Cep            = @cep,
                    Fone           = @fone,           Email          = @email,
                    Site           = @site,           RgInscEst      = @rgInscEst,
                    InscEstSubTrib = @inscEstSubTrib, CpfCnpj        = @cpfCnpj,
                    TipoPessoa     = @tipoPessoa,     CodCondicao    = @codCondicao,
                    Ativo          = @ativo
                WHERE CodForn = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodForn);
            Params(cmd, body);
            await cmd.ExecuteNonQueryAsync();

            var mudancas = new List<string>();

            if (antes?.Fornecedor != body.Fornecedor) 
                mudancas.Add($"Fornecedor: {body.Fornecedor} (Era {antes?.Fornecedor})");
            if (antes?.NomeFantasia != body.NomeFantasia) mudancas.Add($"Nome Fantasia: {body.NomeFantasia} (Era {antes?.NomeFantasia})");
            if (antes?.CpfCnpj != body.CpfCnpj) 
                mudancas.Add($"CPF/CNPJ: {body.CpfCnpj} (Era {antes?.CpfCnpj})");
            if (antes?.RgInscEst != body.RgInscEst) 
                mudancas.Add($"RG/Insc. Est.: {body.RgInscEst} (Era {antes?.RgInscEst})");
            if (antes?.InscEstSubTrib != body.InscEstSubTrib) 
                mudancas.Add($"Insc. Sub. Trib.: {body.InscEstSubTrib} (Era {antes?.InscEstSubTrib})");
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
            if (antes?.Site != body.Site)
                mudancas.Add($"Site: {body.Site} (Era {antes?.Site})");
            if (antes?.TipoPessoa != body.TipoPessoa)
                mudancas.Add($"Tipo Pessoa: {body.TipoPessoa} (Era {antes?.TipoPessoa})");

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
                ? $"Editou Fornecedor: {body.Fornecedor}"
                : $"Editou Fornecedor: {body.Fornecedor}. {diff}";

            await log.AddAsync("Fornecedores", "EDITOU", desc);
        }
        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT Fornecedor FROM Fornecedores WHERE CodForn = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Fornecedores WHERE CodForn = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Fornecedores", "EXCLUIU", $"Excluiu Fornecedor: {nome}");
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

        static void Params(MySqlCommand cmd, Fornecedores b)
        {
            cmd.Parameters.AddWithValue("@fornecedor", b.Fornecedor);
            cmd.Parameters.AddWithValue("@nomeFantasia", b.NomeFantasia);
            cmd.Parameters.AddWithValue("@endereco", b.Endereco);
            cmd.Parameters.AddWithValue("@numero", b.Numero);
            cmd.Parameters.AddWithValue("@complemento", b.Complemento);
            cmd.Parameters.AddWithValue("@bairro", b.Bairro);
            cmd.Parameters.AddWithValue("@codCidade", b.CodCidade);
            cmd.Parameters.AddWithValue("@cep", b.Cep);
            cmd.Parameters.AddWithValue("@fone", b.Fone);
            cmd.Parameters.AddWithValue("@email", b.Email);
            cmd.Parameters.AddWithValue("@site", b.Site);
            cmd.Parameters.AddWithValue("@rgInscEst", b.RgInscEst);
            cmd.Parameters.AddWithValue("@inscEstSubTrib", b.InscEstSubTrib);
            cmd.Parameters.AddWithValue("@cpfCnpj", b.CpfCnpj);
            cmd.Parameters.AddWithValue("@tipoPessoa", b.TipoPessoa);
            cmd.Parameters.AddWithValue("@codCondicao", b.CodCondicao);
            cmd.Parameters.AddWithValue("@ativo", b.Ativo);
        }

        static Fornecedores Map(MySqlDataReader rd) => new()
        {
            CodForn = rd.GetInt32("CodForn"),
            Fornecedor = rd.IsDBNull(rd.GetOrdinal("Fornecedor")) ? null : rd.GetString("Fornecedor"),
            NomeFantasia = rd.IsDBNull(rd.GetOrdinal("NomeFantasia")) ? null : rd.GetString("NomeFantasia"),
            Endereco = rd.IsDBNull(rd.GetOrdinal("Endereco")) ? null : rd.GetString("Endereco"),
            Numero = rd.IsDBNull(rd.GetOrdinal("Numero")) ? 0 : rd.GetInt32("Numero"),
            Complemento = rd.IsDBNull(rd.GetOrdinal("Complemento")) ? null : rd.GetString("Complemento"),
            Bairro = rd.IsDBNull(rd.GetOrdinal("Bairro")) ? null : rd.GetString("Bairro"),
            CodCidade = rd.IsDBNull(rd.GetOrdinal("CodCidade")) ? 0 : rd.GetInt32("CodCidade"),
            Cep = rd.IsDBNull(rd.GetOrdinal("Cep")) ? null : rd.GetString("Cep"),
            Fone = rd.IsDBNull(rd.GetOrdinal("Fone")) ? null : rd.GetString("Fone"),
            Email = rd.IsDBNull(rd.GetOrdinal("Email")) ? null : rd.GetString("Email"),
            Site = rd.IsDBNull(rd.GetOrdinal("Site")) ? null : rd.GetString("Site"),
            RgInscEst = rd.IsDBNull(rd.GetOrdinal("RgInscEst")) ? null : rd.GetString("RgInscEst"),
            InscEstSubTrib = rd.IsDBNull(rd.GetOrdinal("InscEstSubTrib")) ? null : rd.GetString("InscEstSubTrib"),
            CpfCnpj = rd.IsDBNull(rd.GetOrdinal("CpfCnpj")) ? null : rd.GetString("CpfCnpj"),
            TipoPessoa = rd.IsDBNull(rd.GetOrdinal("TipoPessoa")) ? null : rd.GetString("TipoPessoa"),
            CodCondicao = rd.IsDBNull(rd.GetOrdinal("CodCondicao")) ? 0 : rd.GetInt32("CodCondicao"),
            Ativo = rd.GetBoolean("Ativo"),
            Cidade = new Cidades
            {
                CodCidade = rd.IsDBNull(rd.GetOrdinal("CodCidade")) ? 0 : rd.GetInt32("CodCidade"),
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
}