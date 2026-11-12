using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MySurveyApp.NoSqlService.DTO;
using MySurveyApp.NoSqlService.Models;
using MySurveyApp.NoSqlService.Services;
using MySurveyApp.Shared.DTO;

namespace MySurveyApp.NoSqlService.Controllers;

[Route("api/internal/responses")]
[ApiController]
public class ResponsesController : ControllerBase
{
    private readonly IMongoCollection<SurveyResponseDocument> _responsesCollection;
    private readonly SqlEnrichmentClient _sqlClient;

    public ResponsesController(
        IMongoCollection<SurveyResponseDocument> responsesCollection,
        SqlEnrichmentClient sqlClient)
    {
        _responsesCollection = responsesCollection;
        _sqlClient = sqlClient;
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> SubmitResponse(
        [FromBody] SubmitSurveyResponseDto dto,
        CancellationToken cancellationToken)
    {
        // 1. Витягуємо UserId з JWT-токена (якщо передано Authorization: Bearer ...)
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? userId = Guid.TryParse(userIdClaim, out var parsedGuid) ? parsedGuid : null;

        // 2. Або беремо токен анонімного користувача із заголовка
        var anonymousToken = Request.Headers["X-Anonymous-Token"].FirstOrDefault();

        if (userId == null && string.IsNullOrWhiteSpace(anonymousToken))
        {
            return Unauthorized(new
            {
                message = "Необхідно передати JWT-токен (Authorization: Bearer) або токен аноніма (X-Anonymous-Token)."
            });
        }

        if (dto.SelectedOptionIds.Count == 0 && string.IsNullOrWhiteSpace(dto.OpenAnswer))
        {
            return BadRequest(new { message = "Необхідно передати хоча б один ID варіанту або відкриту відповідь." });
        }

        // 3. Отримуємо збагачений контекст із SqlService
        EnrichmentContextResponseDto? context;
        try
        {
            context = await _sqlClient.FetchContextAsync(
                userId,
                anonymousToken,
                dto.SurveyId,
                dto.SelectedOptionIds,
                cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                message = "Помилка отримання даних із SQL-сервісу.",
                details = ex.Message
            });
        }

        if (context == null)
        {
            return BadRequest(new { message = "Не вдалося сформувати контекст відповіді." });
        }

        // 4. Формуємо знеособлений документ для MongoDB (жодних ID чи токенів користувача)
        var finalAnswers = context.ResolvedAnswers.Count > 0
            ? context.ResolvedAnswers
            : new List<string> { dto.OpenAnswer!.Trim() };

        var document = new SurveyResponseDocument
        {
            SurveyId = context.SurveyId,
            SurveyType = context.SurveyType,
            Answers = finalAnswers,
            Region = context.SurveyRegion,
            SurveyDomain = context.SurveyDomain,
            SurveyTopic = context.SurveyTopic,
            AnsweredAt = DateTime.UtcNow,
            IsPreferredDomain = dto.IsPreferredDomain,
            UserSnapshot = new UserSnapshot
            {
                Gender = context.UserSnapshot.Gender,
                BirthYear = context.UserSnapshot.BirthYear.HasValue ? new DateTime(context.UserSnapshot.BirthYear.Value, 1, 1, 0, 0, 0, DateTimeKind.Utc) : null,
                RegionName = context.UserSnapshot.RegionName,
                OccDomainName = context.UserSnapshot.OccDomainName,
                OccupationName = context.UserSnapshot.OccupationName,
                HobbyName = context.UserSnapshot.HobbyName
            }
        };

        // 5. Асинхронний неблокуючий запис у MongoDB
        await _responsesCollection.InsertOneAsync(document, cancellationToken: cancellationToken);

        return Created(string.Empty, new
        {
            message = "Відповідь успішно зафіксована.",
            responseId = document.Id
        });
    }
}