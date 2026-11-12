using MongoDB.Bson.Serialization.Attributes;

namespace MySurveyApp.NoSqlService.Models;

public class UserSnapshot
{
    [BsonElement("gender")]
    public string Gender { get; set; } = string.Empty;

    [BsonElement("birth_year")]
    public DateTime? BirthYear { get; set; }

    [BsonElement("region_name")]
    public string RegionName { get; set; } = string.Empty;

    [BsonElement("occ_domain_name")]
    public string OccDomainName { get; set; } = string.Empty;

    [BsonElement("occupation_name")]
    public string OccupationName { get; set; } = string.Empty;

    [BsonElement("hobby_name")]
    public string HobbyName { get; set; } = string.Empty;
}