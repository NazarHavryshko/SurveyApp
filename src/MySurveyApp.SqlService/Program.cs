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

var builder = WebApplication.CreateBuilder(args);

// Отримуємо рядок підключення з appsettings.json
var connectionString = builder.Configuration.GetConnectionString("Postgres");

// Реєструємо SurveyDbContext у DI-контейнері
builder.Services.AddDbContext<SurveyDbContext>(options =>
    options.UseNpgsql(connectionString));

// Додаємо підтримку контролерів 
builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<SurveyDbContext>();
    // Застосовує всі не застосовані міграції або створює базу, якщо її немає
    dbContext.Database.Migrate();
}

// Налаштовуємо маршрутизацію запитів
app.UseRouting();
app.MapControllers();

app.Run();