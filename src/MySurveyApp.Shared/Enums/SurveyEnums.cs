namespace MySurveyApp.Shared.Enums;

/// <summary>
/// Статус активності опитування
/// </summary>
public enum SurveyStatus
{
    Pending,
    Active,
    Closed,
    Archived
}

/// <summary>
/// Тип запитання в опитуванні
/// </summary>
public enum SurveyType
{
    SingleChoice,
    MultipleChoice,
    RatingScale
}