using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MediaProcessing.Database;
using MediaProcessing.Services;
using BuildingBlocks.SharedContracts;
using BuildingBlocks.SharedContracts.ShellScope;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Npgsql Postgres Database context under isolated schema 'media'
builder.Services.AddDbContext<MediaDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresConnection") ?? 
        "Host=localhost;Database=social_app_db;Username=postgres;Password=postgres"));

// Generic Elasticsearch Repository
builder.Services.AddSingleton(typeof(IElasticSearchRepository<>), typeof(ElasticSearchRepository<>));

// Register ShellScope Factory for isolated execution lifetimes
builder.Services.AddSingleton<IShellScopeFactory, ShellScopeFactory>();

// Register Cloudinary image and Tri-Key Google Drive storage services
builder.Services.AddSingleton<ICloudinaryService, CloudinaryService>();
builder.Services.AddSingleton<IGoogleDriveStorageService, GoogleDriveStorageService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.Run();
