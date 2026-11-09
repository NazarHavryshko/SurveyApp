namespace MySurveyApp.SqlService.DTO
{
    public class CreateSurveyDto
    {
        public string SurveyText { get; set; }
        public string SurveyType { get; set; } // Наприклад: "SingleChoice", "MultipleChoice"
        public int TopicId { get; set; }
        public int? RegionTargetId { get; set; }
        public DateTime ExpiresAt { get; set; }

        // Список варіантів відповідей, які юзер створює разом з опитуванням
        public List<CreateSurveyOptionDto> Options { get; set; } = new();
    }

    public class CreateSurveyOptionDto
    {
        public string OptionText { get; set; }
        public int OrderIndex { get; set; }
    }

    public class UpdateSurveyByModeratorDto
    {
        public string? SurveyText { get; set; }
        public string? SurveyType { get; set; }
        public int? TopicId { get; set; }
        public int? RegionTargetId { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? Status { get; set; }

        // Використовуємо той самий клас DTO, що й при створенні
        public List<CreateSurveyOptionDto>? Options { get; set; }
    }

    public class RecordInteractionDto
    {
        public int SurveyId { get; set; }
        public Guid UserId { get; set; }
    }
}