namespace MySurveyApp.SqlService.DTO
{
    using System.ComponentModel.DataAnnotations;

    public class CreateSurveyDto
    {
        [Required(ErrorMessage = "Текст опитування є обов'язковим.")]
        [StringLength(300, MinimumLength = 5, ErrorMessage = "Текст опитування має містити від 5 до 300 символів.")]
        public string SurveyText { get; set; } = string.Empty;

        [Required(ErrorMessage = "Тип опитування є обов'язковим.")]
        public string SurveyType { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "Оберіть коректну тему опитування.")]
        public int TopicId { get; set; }

        public int? RegionTargetId { get; set; }

        [Range(1, 365, ErrorMessage = "Тривалість опитування має становити від 1 до 365 днів (не більше року).")]
        public int DurationDays { get; set; } = 7;

        public List<CreateSurveyOptionDto>? Options { get; set; }
    }

    public class CreateSurveyOptionDto
    {
        public string OptionText { get; set; } = string.Empty;
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
        public string? RejectionReason { get; set; }

        // Використовуємо той самий клас DTO, що й при створенні
        public List<CreateSurveyOptionDto>? Options { get; set; }
    }

    public class RecordInteractionDto
    {
        public int SurveyId { get; set; }
        public Guid UserId { get; set; }
    }
    public record SurveyOptionDto(int OptionId, string OptionText);

    public record RandomSurveyDto(
    int SurveyId,
    string SurveyText,
    string SurveyType,
    int TopicId,
    List<SurveyOptionDto> Options
);
}