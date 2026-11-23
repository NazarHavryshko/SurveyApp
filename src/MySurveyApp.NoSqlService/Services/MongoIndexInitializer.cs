using MongoDB.Driver;
using MySurveyApp.NoSqlService.Models;

namespace MySurveyApp.NoSqlService.Services;

public static class MongoIndexInitializer
{
    public static async Task InitializeIndexesAsync(IMongoDatabase database, CancellationToken cancellationToken = default)
    {
        // 1. Колекція survey_responses та її індекси
        var responsesCollection = database.GetCollection<SurveyResponseDocument>("survey_responses");

        var responseIndexKeys = Builders<SurveyResponseDocument>.IndexKeys.Ascending(r => r.SurveyId);
        var responseIndexModel = new CreateIndexModel<SurveyResponseDocument>(
            responseIndexKeys,
            new CreateIndexOptions { Name = "idx_survey_responses_survey_id" }
        );
        await responsesCollection.Indexes.CreateOneAsync(responseIndexModel, cancellationToken: cancellationToken);

        // 2. Колекція survey_comments та її унікальний індекс
        var commentsCollection = database.GetCollection<SurveyCommentDocument>("survey_comments");

        var commentIndexKeys = Builders<SurveyCommentDocument>.IndexKeys.Ascending(c => c.SurveyId);
        var commentIndexModel = new CreateIndexModel<SurveyCommentDocument>(
            commentIndexKeys,
            new CreateIndexOptions { Name = "idx_survey_comments_survey_id_unique", Unique = true }
        );
        await commentsCollection.Indexes.CreateOneAsync(commentIndexModel, cancellationToken: cancellationToken);
    }
}