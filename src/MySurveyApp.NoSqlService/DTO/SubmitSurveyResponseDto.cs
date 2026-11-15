namespace MySurveyApp.NoSqlService.DTO;

public record SubmitSurveyResponseDto(
    int SurveyId,
    List<int> SelectedOptionIds,
    string? OpenAnswer = null,
    bool IsPreferredDomain = true,
    long? AnsweredMs = null
);

public record SurveyDiagramResponseDto(
    int SurveyId,
    string SurveyType,
    long TotalResponses,
    List<DiagramItemDto> Items
);

public record DiagramItemDto(
    string Label,
    long Count
);

public record AuthorResponseItemDto(
    DateTime AnsweredAt,
    long? AnsweredMs,
    int? BirthYear,
    string Gender,
    string Region,
    string Occupation,
    string Hobby,
    List<string> Answers
);