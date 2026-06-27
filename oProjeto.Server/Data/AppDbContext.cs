using Microsoft.EntityFrameworkCore;
using oProjeto.Server.Models;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace oProjeto.Data;
/*public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Estados> Estados { get; set; }
    public DbSet<Cidades> Cidades { get; set; }
    public DbSet<Fornecedores> Fornecedores { get; set; }
    public DbSet<NcmShs> NcmShs { get; set; }
    public DbSet<Produtos> Produtos { get; set; }
    public DbSet<Transportadores> Transportadores { get; set; }
    public DbSet<ProdNfes> ProdNfes { get; set; }
    public DbSet<Paises> Paises { get; set; }
    public DbSet<Nfes> Nfes { get; set; }
    public DbSet<Veiculos> Veiculos { get; set; }
    public DbSet<ContasPagar> ContasPagar { get; set; } 
    public DbSet<FormaPagamentos> FormaPagamentos { get; set; } 
    public DbSet<CondicaoPagamentos> CondicaoPagamentos { get; set; }
    public DbSet<Parcelas> Parcelas { get; set; }
    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Paises>()
          .Property(p => p.Pais).HasColumnName("Pais");
        mb.Entity<Estados>()
          .Property(e => e.Estado).HasColumnName("estado");
        mb.Entity<Cidades>()
          .Property(c => c.Cidade).HasColumnName("cidade");
        mb.Entity<NcmShs>()
          .Property(n => n.NcmSh).HasColumnName("ncmSh");
        mb.Entity<Transportadores>()
          .Property(t => t.CpfCnpj).HasColumnName("CpfCnpj");

        mb.Entity<Nfes>()
          .HasKey(n => new { n.Numero, n.Serie, n.Modelo });

        mb.Entity<ProdNfes>()
          .HasKey(p => new { p.Numero, p.Serie, p.Modelo, p.CodProd });

        mb.Entity<ProdNfes>()
          .HasOne(p => p.Nfe)
          .WithMany(n => n.ProdNfes)
          .HasForeignKey(p => new { p.Numero, p.Serie, p.Modelo });

        mb.Entity<ContasPagar>()
          .HasKey(c => new { c.Numero, c.Serie, c.Modelo, c.CodForn, c.NumeroParcela });

        mb.Entity<ContasPagar>()
          .HasOne(c => c.Nfe)
          .WithMany()
          .HasForeignKey(c => new { c.Numero, c.Serie, c.Modelo });

        mb.Entity<ContasPagar>()
          .HasOne(c => c.Fornecedor)
          .WithMany()
          .HasForeignKey(c => c.CodForn);
        mb.Entity<FormaPagamentos>()
            .Property(f => f.FormaPagamento).HasColumnName("FormaPagamento");
        mb.Entity<CondicaoPagamentos>()
            .Property(c => c.CondicaoPagamento).HasColumnName("CondicaoPagamento");
        mb.Entity<Parcelas>()
            .Property(n => n.NumeroParcela).HasColumnName("NumeroParcela");
    }
}*/