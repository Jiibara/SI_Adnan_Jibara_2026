using Microsoft.EntityFrameworkCore;
using oProjeto.Data;
using oProjeto.Server.Repository;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(opt => {
        opt.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        opt.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "oProjeto", Version = "v1" });
});

var conn = builder.Configuration.GetConnectionString("DefaultConnection");

/*builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseMySql(conn, ServerVersion.AutoDetect(conn)));*/

// Repositorios
builder.Services.AddScoped<LogRepository>();
builder.Services.AddScoped<PaisRepository>();
builder.Services.AddScoped<EstadoRepository>();
builder.Services.AddScoped<CidadeRepository>();
builder.Services.AddScoped<FornecedorRepository>();
builder.Services.AddScoped<TransportadorRepository>();
builder.Services.AddScoped<VeiculoRepository>();
builder.Services.AddScoped<FormaPagamentoRepository>();
builder.Services.AddScoped<ProdutoRepository>();
builder.Services.AddScoped<CondicaoPagamentoRepository>();
builder.Services.AddScoped<MarcaRepository>();
builder.Services.AddScoped<CategoriaRepository>();
builder.Services.AddScoped<ClienteRepository>();
builder.Services.AddScoped<FuncionarioRepository>();
builder.Services.AddScoped<FuncaoRepository>();

builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:5173", "http://localhost:3000")
         .AllowAnyHeader()
         .AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.MapControllers();
app.Run();