using System.Globalization;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using MySurveyApp.NoSqlService.DTO;
using MySurveyApp.NoSqlService.Models;

namespace MySurveyApp.NoSqlService.Controllers;

[Route("api/internal/surveys")]
[ApiController]
public class AnalyticsController : ControllerBase
{
    private readonly IMongoCollection<SurveyResponseDocument> _responsesCollection;

    public AnalyticsController(IMongoCollection<SurveyResponseDocument> responsesCollection)
    {
        _responsesCollection = responsesCollection;
    }

    [HttpGet("{surveyId:int}/diagram")]
    [ProducesResponseType(typeof(SurveyDiagramResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSurveyDiagram(
        int surveyId,
        CancellationToken cancellationToken)
    {
        // 1. Агрегація на рівні MongoDB (використовує покриваючий індекс за survey_id та answers)
        var matchStage = new BsonDocument("$match", new BsonDocument("survey_id", surveyId));
        var groupStage = new BsonDocument("$group", new BsonDocument
        {
            { "_id", "$answers" },
            { "surveyType", new BsonDocument("$first", "$survey_type") },
            { "count", new BsonDocument("$sum", 1) }
        });

        var pipeline = PipelineDefinition<SurveyResponseDocument, BsonDocument>.Create(
            matchStage,
            groupStage);

        using var cursor = await _responsesCollection.AggregateAsync(pipeline, cancellationToken: cancellationToken);
        var rawGroups = await cursor.ToListAsync(cancellationToken);

        if (rawGroups.Count == 0)
        {
            return Ok(new SurveyDiagramResponseDto(
                SurveyId: surveyId,
                SurveyType: "Unknown",
                TotalResponses: 0,
                Items: new List<DiagramItemDto>()));
        }

        var surveyType = rawGroups[0]["surveyType"].AsString;
        var normalizedType = surveyType.Trim().ToLowerInvariant();
        var isMultipleChoice = normalizedType is "multiplechoice" or "multiple";
        var isNumeric = normalizedType is "numeric" or "number" or "numberinput" or "openanswer";

        // 2. Нормалізація груп (для множинного вибору ["Б", "А"] і ["А", "Б"] об'єднуються в одну комбінацію)
        var aggregatedBuckets = rawGroups
            .Select(doc =>
            {
                var options = doc["_id"].AsBsonArray
                    .Select(item => item.AsString)
                    .ToList();

                if (isMultipleChoice)
                {
                    options = options
                        .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
                        .ToList();
                }

                var key = string.Join("\u001F", options);
                var count = doc["count"].ToInt64();
                return new { Key = key, Options = options, Count = count };
            })
            .GroupBy(x => x.Key)
            .Select(g => new
            {
                Options = g.First().Options,
                Count = g.Sum(x => x.Count)
            })
            .ToList();

        var totalResponses = aggregatedBuckets.Sum(b => b.Count);

        // 3. Формування елементів діаграми залежно від типу питання
        var items = aggregatedBuckets.Select(bucket =>
        {
            var percentage = totalResponses > 0
                ? Math.Round((double)bucket.Count / totalResponses * 100, 2)
                : 0;

            if (isMultipleChoice)
            {
                return new DiagramItemDto(
                    Label: string.Join(" + ", bucket.Options),
                    Count: bucket.Count);
            }

            var singleValue = bucket.Options.FirstOrDefault() ?? string.Empty;

            if (isNumeric)
            {
                double? parsedNumber = double.TryParse(
                    singleValue.Replace(',', '.'),
                    NumberStyles.Any,
                    CultureInfo.InvariantCulture,
                    out var num)
                    ? num
                    : null;

                return new DiagramItemDto(
                    Label: singleValue,
                    Count: bucket.Count);
            }

            // Один варіант відповіді (SingleChoice)
            return new DiagramItemDto(
                Label: singleValue,
                Count: bucket.Count);
        });

        var sortedItems = items.OrderByDescending(i => i.Count).ToList();

        return Ok(new SurveyDiagramResponseDto(
            SurveyId: surveyId,
            SurveyType: surveyType,
            TotalResponses: totalResponses,
            Items: sortedItems));
    }

    /// <summary>
    /// Повний експорт знеособлених відповідей опитування у форматі CSV
    /// </summary>
    [Authorize]
    [HttpGet("{surveyId:int}/responses/csv")]
    [Produces("text/csv")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportSurveyResponsesCsv(
    int surveyId,
    CancellationToken cancellationToken)
    {
        var filter = Builders<SurveyResponseDocument>.Filter.Eq(d => d.SurveyId, surveyId);
        var sort = Builders<SurveyResponseDocument>.Sort.Ascending(d => d.AnsweredAt);

        var documents = await _responsesCollection
            .Find(filter)
            .Sort(sort)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();

        // Заголовки стовпців без дати/часу та часу реакції
        sb.AppendLine(string.Join(";", new[]
        {
        "№",
        "Рік народження",
        "Стать",
        "Регіон респондента",
        "Галузь діяльності",
        "Професія",
        "Хобі",
        "Питання з обраної теми",
        "Відповідь"
    }.Select(EscapeCsv)));

        for (int i = 0; i < documents.Count; i++)
        {
            var doc = documents[i];
            var snap = doc.UserSnapshot;

            string birthYearStr = snap?.BirthYear is > 1900
                ? snap.BirthYear.Value.ToString(CultureInfo.InvariantCulture)
                : "Не вказано";

            string answersStr = doc.Answers != null && doc.Answers.Count > 0
                ? string.Join(" | ", doc.Answers)
                : "";

            var row = new[]
            {
            (i + 1).ToString(CultureInfo.InvariantCulture),
            birthYearStr,
            string.IsNullOrWhiteSpace(snap?.Gender) ? "Не вказано" : snap.Gender,
            string.IsNullOrWhiteSpace(snap?.RegionName) ? "Не вказано" : snap.RegionName,
            string.IsNullOrWhiteSpace(snap?.OccDomainName) ? "Не вказано" : snap.OccDomainName,
            string.IsNullOrWhiteSpace(snap?.OccupationName) ? "Не вказано" : snap.OccupationName,
            string.IsNullOrWhiteSpace(snap?.HobbyName) ? "Не вказано" : snap.HobbyName,
            doc.IsPreferredDomain ? "Так" : "Ні",
            answersStr
        };

            sb.AppendLine(string.Join(";", row.Select(EscapeCsv)));
        }

        var bom = Encoding.UTF8.GetPreamble();
        var csvBytes = Encoding.UTF8.GetBytes(sb.ToString());
        var resultBytes = new byte[bom.Length + csvBytes.Length];
        Buffer.BlockCopy(bom, 0, resultBytes, 0, bom.Length);
        Buffer.BlockCopy(csvBytes, 0, resultBytes, bom.Length, csvBytes.Length);

        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd_HH-mm", CultureInfo.InvariantCulture);
        var fileName = $"survey_responses_{timestamp}.csv";

        return File(resultBytes, "text/csv; charset=utf-8", fileName);
    }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return "\"\"";

        var normalized = value.Replace("\r\n", " ").Replace("\n", " ").Replace("\r", " ");
        return $"\"{normalized.Replace("\"", "\"\"")}\"";
    }
}