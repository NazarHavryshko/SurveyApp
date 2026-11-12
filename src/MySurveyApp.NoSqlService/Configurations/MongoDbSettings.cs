namespace MySurveyApp.NoSqlService.Configurations;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string ResponsesCollectionName { get; set; } = string.Empty;
}