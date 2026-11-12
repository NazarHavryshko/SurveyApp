using System.Globalization;
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
}