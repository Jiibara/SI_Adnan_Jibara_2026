using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace oProjeto.Server.Validacoes
{
    // Atributos de validação usados nos Models.
    // Todos aceitam valor vazio/nulo (campo opcional); para obrigar, use [Required].

    internal static class Doc
    {
        public static string Digitos(object? v) => Regex.Replace(v?.ToString() ?? "", @"\D", "");

        public static bool Cpf(string cpf)
        {
            if (cpf.Length != 11 || cpf.Distinct().Count() == 1) return false;
            int Dv(int n)
            {
                var soma = 0;
                for (var i = 0; i < n; i++) soma += (cpf[i] - '0') * (n + 1 - i);
                var r = soma * 10 % 11;
                return r == 10 ? 0 : r;
            }
            return Dv(9) == cpf[9] - '0' && Dv(10) == cpf[10] - '0';
        }

        public static bool Cnpj(string cnpj)
        {
            if (cnpj.Length != 14 || cnpj.Distinct().Count() == 1) return false;
            int Dv(int n)
            {
                int[] pesos = n == 12
                    ? new[] { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 }
                    : new[] { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
                var soma = 0;
                for (var i = 0; i < n; i++) soma += (cnpj[i] - '0') * pesos[i];
                var r = soma % 11;
                return r < 2 ? 0 : 11 - r;
            }
            return Dv(12) == cnpj[12] - '0' && Dv(13) == cnpj[13] - '0';
        }
    }

    /// <summary>CPF (11 dígitos) ou CNPJ (14 dígitos) com dígito verificador válido.</summary>
    public class CpfCnpjAttribute : ValidationAttribute
    {
        public CpfCnpjAttribute() : base("CPF/CNPJ inválido.") { }

        public override bool IsValid(object? value)
        {
            if (string.IsNullOrWhiteSpace(value?.ToString())) return true;
            var d = Doc.Digitos(value);
            return d.Length == 11 ? Doc.Cpf(d) : Doc.Cnpj(d);
        }
    }

    /// <summary>Placa antiga (ABC1234 / ABC-1234) ou Mercosul (ABC1D23).</summary>
    public class PlacaAttribute : ValidationAttribute
    {
        public PlacaAttribute() : base("Placa inválida.") { }

        public override bool IsValid(object? value)
        {
            var placa = (value?.ToString() ?? "").Replace("-", "").Replace(" ", "").ToUpperInvariant();
            return placa.Length == 0 || Regex.IsMatch(placa, @"^[A-Z]{3}\d[A-Z\d]\d{2}$");
        }
    }

    /// <summary>Aceita apenas dígitos (CEP, número/série/modelo da nota...).</summary>
    public class SomenteDigitosAttribute : ValidationAttribute
    {
        public SomenteDigitosAttribute() : base("O campo {0} aceita apenas números.") { }

        public override bool IsValid(object? value)
        {
            var s = value?.ToString() ?? "";
            return s.Length == 0 || s.All(char.IsDigit);
        }
    }
}
