using Microsoft.EntityFrameworkCore;
using MySurveyApp.Shared.Enums;
using MySurveyApp.SqlService.Data;
using MySurveyApp.SqlService.Models;

namespace MySurveyApp.SqlService.Services;

public class AnonymousUsersCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AnonymousUsersCleanupService> _logger;
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(24);

    public AnonymousUsersCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<AnonymousUsersCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Невелика затримка при старті, щоб БД встигла ініціалізуватися та застосувати міграції
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupInactiveAnonymousUsersAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час фонового очищення неактивних Anonymous-користувачів.");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }

    private async Task CleanupInactiveAnonymousUsersAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SurveyDbContext>();

        var cutoffDate = DateTime.UtcNow.AddMonths(-6);

        // Видаляємо одним ефективним SQL-запитом (EF Core ExecuteDeleteAsync)
        // Адаптуйте умову UserType та дати під ваші властивості моделі User
        var deletedCount = await dbContext.Users
            .Where(u => u.UserType == UserType.Anonymous && u.LastActiveAt < cutoffDate)
            .ExecuteDeleteAsync(cancellationToken);

        if (deletedCount > 0)
        {
            _logger.LogInformation(
                "Фонове очищення: видалено {Count} неактивних Anonymous-користувачів (старше {CutoffDate:yyyy-MM-dd}).",
                deletedCount,
                cutoffDate);
        }
    }
}