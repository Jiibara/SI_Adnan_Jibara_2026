using MySqlConnector;
using oProjeto.Server.Models;

namespace oProjeto.Server.Repository
{
    public class TransportadorRepository(IConfiguration cfg, LogRepository log)
    {
        private MySqlConnection Conn() =>
            new(cfg.GetConnectionString("DefaultConnection"));

        public async Task<IEnumerable<Transportadores>> GetAllAsync()
        {
            var list = new List<Transportadores>();
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT t.*,
                       c.Cidade, c.CodEstado, c.Ativo AS CidadeAtivo,
                       e.UF, e.Estado, e.CodPais, e.Ativo AS EstadoAtivo,
                       v.PlacaVeic, v.PlacaMercoSul, v.Ativo AS VeicAtivo
                FROM Transportadores t
                LEFT JOIN Cidades c ON c.CodCidade = t.CodCidade
                LEFT JOIN Estados e ON e.CodEstado = c.CodEstado
                LEFT JOIN Veiculos v ON v.CodVeic  = t.CodVeic
                ORDER BY t.CodTransp ASC", con);
            await using var rd = await cmd.ExecuteReaderAsync();
            while (await rd.ReadAsync())
                list.Add(Map(rd));
            return list;
        }
        public async Task<Transportadores?> GetByIdAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                SELECT t.*,
                       c.Cidade, c.CodEstado, c.Ativo AS CidadeAtivo,
                       e.UF, e.Estado, e.CodPais, e.Ativo AS EstadoAtivo,
                       v.PlacaVeic, v.PlacaMercoSul, v.Ativo AS VeicAtivo
                FROM Transportadores t
                LEFT JOIN Cidades c ON c.CodCidade = t.CodCidade
                LEFT JOIN Estados e ON e.CodEstado = c.CodEstado
                LEFT JOIN Veiculos v ON v.CodVeic  = t.CodVeic
                WHERE t.CodTransp = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rd = await cmd.ExecuteReaderAsync();
            return await rd.ReadAsync() ? Map(rd) : null;
        }
        public async Task<Transportadores> CreateAsync(Transportadores body)
        {
            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                INSERT INTO Transportadores
                    (Transportador, NomeFantasia, Endereco, Numero, Complemento, Bairro,
                     CodCidade, Cep, Fone, Email, Site, RgInscEst,
                     CpfCnpj, TipoPessoa, CodVeic, Ativo)
                VALUES
                    (@transportador, @nomeFantasia, @endereco, @numero, @complemento, @bairro,
                     @codCidade, @cep, @fone, @email, @site, @rgInscEst,
                     @cpfCnpj, @tipoPessoa, @codVeic, @ativo);
                SELECT LAST_INSERT_ID();", con);
            Params(cmd, body);
            body.CodTransp = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            await log.AddAsync("Transportadores", "CRIOU", $"Criou Transportador: {body.Transportador}");
            return body;
        }
        public async Task UpdateAsync(Transportadores body)
        {
            var antes = await GetByIdAsync(body.CodTransp);

            await using var con = Conn();
            await con.OpenAsync();
            await using var cmd = new MySqlCommand(@"
                UPDATE Transportadores SET
                    Transportador = @transportador, NomeFantasia = @nomeFantasia,
                    Endereco = @endereco, Numero = @numero,
                    Complemento = @complemento, Bairro = @bairro,
                    CodCidade = @codCidade, Cep = @cep,
                    Fone = @fone, Email = @email,
                    Site = @site, RgInscEst = @rgInscEst,
                    CpfCnpj = @cpfCnpj, TipoPessoa = @tipoPessoa,
                    CodVeic = @codVeic, Ativo = @ativo
                WHERE CodTransp = @id", con);
            cmd.Parameters.AddWithValue("@id", body.CodTransp);
            Params(cmd, body);
            await cmd.ExecuteNonQueryAsync();

            var mudancas = new List<string>();

            if (antes?.Transportador != body.Transportador) 
                mudancas.Add($"Transportador: {body.Transportador} (Era {antes?.Transportador})");
            if (antes?.NomeFantasia != body.NomeFantasia) 
                mudancas.Add($"Nome Fantasia: {body.NomeFantasia} (Era {antes?.NomeFantasia})");
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
            if (antes?.Site != body.Site) 
                mudancas.Add($"Site: {body.Site} (Era {antes?.Site})");
            if (antes?.TipoPessoa != body.TipoPessoa)
                mudancas.Add($"Tipo Pessoa: {body.TipoPessoa} (Era {antes?.TipoPessoa})");

            if (antes?.CodCidade != body.CodCidade)
            {
                var nomeCidadeNova = await GetNomeCidadeAsync(con, body.CodCidade);
                mudancas.Add($"Cidade: {nomeCidadeNova} (Era {antes?.Cidade?.Cidade})");
            }

            if (antes?.CodVeic != body.CodVeic)
            {
                var placaVeicNovo = await GetPlacaVeicAsync(con, body.CodVeic);
                mudancas.Add($"Veículo: {placaVeicNovo} (Era {antes?.Veiculo?.PlacaVeic})");
            }

            if (antes?.Ativo != body.Ativo)
                mudancas.Add($"Ativo: {(body.Ativo ? "Sim" : "Não")} (Era {(antes?.Ativo == true ? "Sim" : "Não")})");

            var diff = mudancas.Count > 0 ? string.Join(". ", mudancas) : "";
            var desc = string.IsNullOrEmpty(diff)
                ? $"Editou Transportador: {body.Transportador}"
                : $"Editou Transportador: {body.Transportador}. {diff}";

            await log.AddAsync("Transportadores", "EDITOU", desc);
        }
        public async Task DeleteAsync(int id)
        {
            await using var con = Conn();
            await con.OpenAsync();

            string nome;
            await using (var sel = new MySqlCommand("SELECT Transportador FROM Transportadores WHERE CodTransp = @id", con))
            {
                sel.Parameters.AddWithValue("@id", id);
                nome = (await sel.ExecuteScalarAsync())?.ToString() ?? "";
            }

            await using var cmd = new MySqlCommand("DELETE FROM Transportadores WHERE CodTransp = @id", con);
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();

            await log.AddAsync("Transportadores", "EXCLUIU", $"Excluiu Transportador: {nome}");
        }

        private static async Task<string> GetNomeCidadeAsync(MySqlConnection con, int codCidade)
        {
            await using var cmd = new MySqlCommand("SELECT Cidade FROM Cidades WHERE CodCidade = @id", con);
            cmd.Parameters.AddWithValue("@id", codCidade);
            return (await cmd.ExecuteScalarAsync())?.ToString() ?? codCidade.ToString();
        }

        private static async Task<string> GetPlacaVeicAsync(MySqlConnection con, int codVeic)
        {
            await using var cmd = new MySqlCommand("SELECT PlacaVeic FROM Veiculos WHERE CodVeic = @id", con);
            cmd.Parameters.AddWithValue("@id", codVeic);
            return (await cmd.ExecuteScalarAsync())?.ToString() ?? codVeic.ToString();
        }
        static void Params(MySqlCommand cmd, Transportadores b)
        {
            cmd.Parameters.AddWithValue("@transportador", b.Transportador);
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
            cmd.Parameters.AddWithValue("@cpfCnpj", b.CpfCnpj);
            cmd.Parameters.AddWithValue("@tipoPessoa", b.TipoPessoa);
            cmd.Parameters.AddWithValue("@codVeic", b.CodVeic);
            cmd.Parameters.AddWithValue("@ativo", b.Ativo);
        }

        static Transportadores Map(MySqlDataReader rd) => new()
        {
            CodTransp = rd.GetInt32("CodTransp"),
            Transportador = rd.IsDBNull(rd.GetOrdinal("Transportador")) ? null : rd.GetString("Transportador"),
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
            CpfCnpj = rd.IsDBNull(rd.GetOrdinal("CpfCnpj")) ? null : rd.GetString("CpfCnpj"),
            TipoPessoa = rd.IsDBNull(rd.GetOrdinal("TipoPessoa")) ? null : rd.GetString("TipoPessoa"),
            CodVeic = rd.IsDBNull(rd.GetOrdinal("CodVeic")) ? 0 : rd.GetInt32("CodVeic"),
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
            Veiculo = rd.IsDBNull(rd.GetOrdinal("CodVeic")) ? null : new Veiculos
            {
                CodVeic = rd.GetInt32("CodVeic"),
                PlacaVeic = rd.IsDBNull(rd.GetOrdinal("PlacaVeic")) ? null : rd.GetString("PlacaVeic"),
                PlacaMercoSul = rd.IsDBNull(rd.GetOrdinal("PlacaMercoSul")) ? null : rd.GetString("PlacaMercoSul"),
                Ativo = rd.IsDBNull(rd.GetOrdinal("VeicAtivo")) ? false : rd.GetBoolean("VeicAtivo"),
            }
        };
    }
}