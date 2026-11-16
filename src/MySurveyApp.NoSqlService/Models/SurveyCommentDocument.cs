using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MySurveyApp.NoSqlService.Models;

public class ReplyItem
{
    [BsonElement("reply_id")]
    public int ReplyId { get; set; }

    [BsonElement("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("nickname")]
    public string Nickname { get; set; } = string.Empty;
}

public class CommentItem
{
    [BsonElement("comment_id")]
    public int CommentId { get; set; }

    [BsonElement("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("nickname")]
    public string Nickname { get; set; } = string.Empty;

    [BsonElement("next_reply_id")]
    public int NextReplyId { get; set; } = 0;

    [BsonElement("replies")]
    public List<ReplyItem> Replies { get; set; } = new();
}

public class SurveyCommentDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("survey_id")]
    public int SurveyId { get; set; }

    [BsonElement("next_comment_id")]
    public int NextCommentId { get; set; } = 0;

    [BsonElement("comments")]
    public List<CommentItem> Comments { get; set; } = new();
}