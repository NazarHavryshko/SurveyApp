using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySurveyApp.Shared.DTO;
using MySurveyApp.SqlService.Data;
using MySurveyApp.SqlService.Models; // простір імен сутності SurveyInteraction

namespace MySurveyApp.SqlService.Controllers;

[Route("api/internal")]
[ApiController]
public class InternalAnalyticsController : ControllerBase
{
    private readonly SurveyDbContext _context;
    private readonly IConfiguration _configuration;

    public InternalAnalyticsController(SurveyDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("enrichment-context")]
    public async Task<IActionResult> GetEnrichmentContext(
        [FromHeader(Name = "X-Api-Key")] string? apiKey,
        [FromBody] EnrichmentContextRequestDto dto)
    {
        var expectedKey = _configuration["InternalApiKey"] ?? "YOUR_SUPER_SECRET_MICROSERVICE_KEY_12345";
        if (string.IsNullOrEmpty(apiKey) || apiKey != expectedKey)
        {
            return Unauthorized(new { message = "Недійсний міжсервісний API-ключ." });
        }

        var survey = await _context.Surveys
            .AsNoTracking()
            .Include(s => s.SurveyTopic)
                .ThenInclude(t => t!.SurveyDomain)
            .Include(s => s.Region)
            .Include(s => s.SurveyOptions)
            .FirstOrDefaultAsync(s => s.SurveyId == dto.SurveyId);

        if (survey == null)
        {
            return NotFound(new { message = $"Опитування з ID {dto.SurveyId} не знайдено." });
        }

        var userQuery = _context.Users
            .Include(u => u.Region)
            .Include(u => u.Occupation)
                .ThenInclude(o => o!.OccupationDomain)
            .Include(u => u.Hobby);

        var user = dto.UserId.HasValue
            ? await userQuery.FirstOrDefaultAsync(u => u.UserId == dto.UserId.Value)
            : await userQuery.FirstOrDefaultAsync(u => u.UserId.ToString() == dto.AnonymousToken);

        if (user == null)
        {
            return NotFound(new { message = "Користувача за переданим токеном не знайдено." });
        }

        // Перевірка, чи користувач ВЖЕ взаємодіяв з цим опитуванням
        var alreadyInteracted = await _context.Set<SurveyInteraction>()
            .AnyAsync(si => si.SurveyId == survey.SurveyId && si.UserId == user.UserId);

        if (alreadyInteracted)
        {
            return Conflict(new { message = "Користувач вже відповів на це опитування або взаємодіяв з ним." });
        }

        var resolvedAnswers = survey.SurveyOptions
            .Where(o => dto.SelectedOptionIds.Contains(o.OptionId))
            .OrderBy(o => o.OrderIndex)
            .Select(o => o.OptionText)
            .ToList();

        // Інкремент лічильника відповідей та фіксація взаємодії в одній транзакції
        user.AnswersCount += 1;

        _context.Set<SurveyInteraction>().Add(new SurveyInteraction
        {
            UserId = user.UserId,
            SurveyId = survey.SurveyId
        });

        await _context.SaveChangesAsync();

        var response = new EnrichmentContextResponseDto(
            SurveyId: survey.SurveyId,
            SurveyType: survey.SurveyType.ToString(),
            ResolvedAnswers: resolvedAnswers,
            SurveyRegion: survey.Region?.RegionName ?? "Всі регіони",
            SurveyDomain: survey.SurveyTopic?.SurveyDomain?.DomainName ?? "Загальне",
            SurveyTopic: survey.SurveyTopic?.TopicName ?? "Без теми",
            UserSnapshot: new UserSnapshotDto(
                Gender: user.Gender.ToString(),
                BirthYear: user.BirthYear,
                RegionName: user.Region?.RegionName ?? "Не вказано",
                OccDomainName: user.Occupation?.OccupationDomain?.DomainName ?? "Не вказано",
                OccupationName: user.Occupation?.OccupationName ?? "Не вказано",
                HobbyName: user.Hobby?.HobbyName ?? "Не вказано"
            )
        );

        return Ok(response);
    }
}