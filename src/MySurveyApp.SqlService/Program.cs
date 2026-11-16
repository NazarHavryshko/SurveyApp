using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using MySurveyApp.SqlService.Data;
using MySurveyApp.SqlService.Models;
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

// Реєструємо Swagger / OpenAPI (єдиний блок ДО builder.Build())
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Введіть JWT токен"
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

// Налаштування JWT-аутентифікації
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultForbidScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var secretKey = "YOUR_SUPER_SECRET_KEY_FOR_JWT_SURVEY_APP_2026!";

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

var app = builder.Build();

// Застосування міграцій та тригерів БД при старті
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<SurveyDbContext>();
    dbContext.Database.Migrate();
    await dbContext.Database.ExecuteSqlRawAsync(Triggers.CreateTriggersSql);
}

// Робимо Swagger доступним у Docker
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "MySurveyApp SQL API v1");
    c.RoutePrefix = string.Empty; // Відкриває UI на кореневому шляху "/"
});

// Налаштовуємо маршрутизацію та безпеку запитів
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();