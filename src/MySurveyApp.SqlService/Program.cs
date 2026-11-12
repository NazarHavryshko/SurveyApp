using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MySurveyApp.SqlService.Data;
using MySurveyApp.SqlService.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using Swashbuckle.AspNetCore.SwaggerUI;
using System.Reflection;
using System.Text;

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

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultForbidScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Замініть цей рядок на ваш секретний ключ (має бути мінімум 32 символи)
    var secretKey = "YOUR_SUPER_SECRET_KEY_FOR_JWT_SURVEY_APP_2026!";

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false, // Для спрощення розробки вимикаємо
        ValidateAudience = false, // Для спрощення розробки вимикаємо
        ValidateLifetime = true, // Перевіряти час життя токена (Expires)
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
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

app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();

app.Run();