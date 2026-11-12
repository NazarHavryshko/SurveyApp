namespace MySurveyApp.Shared.DTO;

public record EnrichmentContextRequestDto(
    Guid? UserId,
    string? AnonymousToken,
    int SurveyId,
    List<int> SelectedOptionIds
);

public record EnrichmentContextResponseDto(
    int SurveyId,
    string SurveyType,
    List<string> ResolvedAnswers,
    string SurveyRegion,
    string SurveyDomain,
    string SurveyTopic,
    UserSnapshotDto UserSnapshot
);

public record UserSnapshotDto(
    string Gender,
    int? BirthYear,
    string RegionName,
    string OccDomainName,
    string OccupationName,
    string HobbyName
);