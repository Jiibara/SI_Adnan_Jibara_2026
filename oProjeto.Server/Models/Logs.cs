using Microsoft.AspNetCore.Http.HttpResults;

namespace oProjeto.Server.Models
{
    public class Log
    {
        public int CodLog { get; set; }
        public string Entidade { get; set; } = "";   
        public string Acao { get; set; } = "";        
        public string Descricao { get; set; } = "";  
        public DateTime CriadoEm { get; set; } = DateTime.Now;
    }
}

