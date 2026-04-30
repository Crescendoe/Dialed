using Microsoft.EntityFrameworkCore;
using BrewTracker.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Brew Tracker API", Version = "v1" });
});

builder.Services.AddDbContext<BrewTrackerContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("BrewTracker")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevFrontend", policy =>
        policy.WithOrigins("http://localhost:5173")  // Vite default port
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("DevFrontend");
app.UseAuthorization();
app.MapControllers();
app.Run();
