namespace MySurveyApp.NoSqlService.DTO;

public record CreateCommentDto(
    string Text,
    int? ParentCommentId = null 
);