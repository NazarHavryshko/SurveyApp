using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MySurveyApp.NoSqlService.Models;

public class SurveyResponseDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("survey_id")]
    public int SurveyId { get; set; }

    [BsonElement("survey_type")]
    public string SurveyType { get; set; } = string.Empty;

    [BsonElement("answers")]
    public List<string> Answers { get; set; } = new();

    [BsonElement("region")]
    public string Region { get; set; } = string.Empty;

    [BsonElement("survey_domain")]
    public string SurveyDomain { get; set; } = string.Empty;

    [BsonElement("survey_topic")]
    public string SurveyTopic { get; set; } = string.Empty;

    [BsonElement("answered_at")]
    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;

    [BsonElement("is_preferred_domain")]
    public bool IsPreferredDomain { get; set; }

    [BsonElement("user_snapshot")]
    public UserSnapshot UserSnapshot { get; set; } = new();
}