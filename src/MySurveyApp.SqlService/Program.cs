/*var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
*/

using Microsoft.EntityFrameworkCore;
using MySurveyApp.SqlService.Data;
using MySurveyApp.SqlService.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using Swashbuckle.AspNetCore.SwaggerUI;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Отримуємо рядок підключення з appsettings.json
var connectionString = builder.Configuration.GetConnectionString("Postgres");

// Реєструємо SurveyDbContext у DI-контейнері
builder.Services.AddDbContext<SurveyDbContext>(options =>
    options.UseNpgsql(connectionString));

// Додаємо підтримку контролерів 
builder.Services.AddControllers();

// Реєструємо Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSwaggerGen(options =>
{
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<SurveyDbContext>();

    dbContext.Database.Migrate();


    await dbContext.Database.ExecuteSqlRawAsync(Triggers.CreateTriggersSql);
}

//робимо доступним у Docker
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "MySurveyApp SQL API v1");
    c.RoutePrefix = string.Empty; // Відкриває UI на кореневому шляху "/"
});



// Налаштовуємо маршрутизацію запитів
app.UseRouting();
app.MapControllers();

app.Run();