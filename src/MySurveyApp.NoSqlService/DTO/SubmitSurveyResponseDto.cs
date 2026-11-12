namespace MySurveyApp.NoSqlService.DTO;

public record SubmitSurveyResponseDto(
    int SurveyId,
    List<int> SelectedOptionIds,
    string? OpenAnswer = null,
    bool IsPreferredDomain = true
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