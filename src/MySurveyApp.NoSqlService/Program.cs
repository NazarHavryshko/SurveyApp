using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using MongoDB.Driver;
using MySurveyApp.NoSqlService.Configurations;
using MySurveyApp.NoSqlService.Models;
using MySurveyApp.NoSqlService.Services;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Налаштування та реєстрація MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

var mongoSettings = builder.Configuration.GetSection("MongoDbSettings").Get<MongoDbSettings>()
    ?? new MongoDbSettings
    {
        ConnectionString = "mongodb://mongoadmin:mongosecretpassword@localhost:27017/?authSource=admin",
        DatabaseName = "MySurveyAppAnalyticsDb",
        ResponsesCollectionName = "survey_responses"
    };

builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoSettings.ConnectionString));
builder.Services.AddSingleton<IMongoDatabase>(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(mongoSettings.DatabaseName));
builder.Services.AddSingleton<IMongoCollection<SurveyResponseDocument>>(sp =>
    sp.GetRequiredService<IMongoDatabase>().GetCollection<SurveyResponseDocument>(mongoSettings.ResponsesCollectionName));
builder.Services.AddSingleton<IMongoCollection<SurveyCommentDocument>>(sp =>
{
    var database = sp.GetRequiredService<IMongoDatabase>();
    return database.GetCollection<SurveyCommentDocument>("SurveyComments"); // або назва вашої колекції в MongoDB
});

// HTTP-клієнт для запитів збагачення даних до SqlService
var sqlServiceUrl = builder.Configuration["SqlServiceSettings:BaseUrl"] ?? "http://localhost:5001";
var internalApiKey = builder.Configuration["InternalApiKey"] ?? "YOUR_SUPER_SECRET_MICROSERVICE_KEY_12345";

builder.Services.AddHttpClient<SqlEnrichmentClient>(client =>
{
    client.BaseAddress = new Uri(sqlServiceUrl);
    client.DefaultRequestHeaders.Add("X-Api-Key", internalApiKey);
    client.Timeout = TimeSpan.FromSeconds(5);
});

// Автентифікація JWT (для розшифрування UserId із токена авторизованих користувачів)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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

builder.Services.AddAuthorization();
builder.Services.AddControllers();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            message = "Забагато запитів. Спробуйте надіслати відповідь трохи пізніше."
        }, cancellationToken);
    };

    // Політика для відправки відповідей: максимум 20 відповідей за 1 хвилину на одного користувача/токен
    options.AddPolicy("ResponsesRateLimit", httpContext =>
    {
        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? httpContext.User.FindFirstValue("sub");

        var anonToken = httpContext.Request.Headers["X-Anonymous-Token"].FirstOrDefault();

        // Визначаємо унікальний ключ партиції
        var partitionKey = !string.IsNullOrWhiteSpace(userId)
            ? $"user:{userId}"
            : !string.IsNullOrWhiteSpace(anonToken)
                ? $"anon:{anonToken}"
                : $"ip:{httpContext.Connection.RemoteIpAddress}";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: partitionKey,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,                  // Максимум 20 запитів
                Window = TimeSpan.FromMinutes(1),  // За 1 хвилину
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0                     // Без черги — одразу 429
            });
    });
});

// Налаштування Swagger (OpenAPI 2.x)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MySurveyApp NoSqlService API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Вставте JWT-токен (без слова Bearer)"
    });

    options.AddSecurityDefinition("AnonymousToken", new OpenApiSecurityScheme
    {
        Name = "X-Anonymous-Token",
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        Description = "Вставте UUID анонімного користувача"
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = [],
        [new OpenApiSecuritySchemeReference("AnonymousToken", document)] = []
    });
});

var app = builder.Build();

// Swagger UI доступний у Docker на кореневому шляху "/"
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "MySurveyApp NoSQL API v1");
    c.RoutePrefix = string.Empty;
});

using (var scope = app.Services.CreateScope())
{
    var mongoDatabase = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
    try
    {
        // Викликаємо метод ініціалізації індексів
        await MongoIndexInitializer.InitializeIndexesAsync(mongoDatabase);
        Console.WriteLine("MongoDB indexes were successfully initialized/verified.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error initializing MongoDB indexes: {ex.Message}");
    }
}

// Автоматичне створення покриваючого індексу idx_fast_diagram_totals при запуску
try
{
    var collection = app.Services.GetRequiredService<IMongoCollection<SurveyResponseDocument>>();
    var indexKeys = Builders<SurveyResponseDocument>.IndexKeys
        .Ascending(d => d.SurveyId)
        .Ascending(d => d.Answers)
        .Ascending(d => d.SurveyType);

    var indexModel = new CreateIndexModel<SurveyResponseDocument>(
        indexKeys,
        new CreateIndexOptions { Name = "idx_fast_diagram_totals" });

    await collection.Indexes.CreateOneAsync(indexModel);
}
catch (Exception ex)
{
    app.Logger.LogWarning(ex, "Не вдалося створити індекс MongoDB під час старту.");
}

// Конвеєр обробки HTTP-запитів
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

app.Run();