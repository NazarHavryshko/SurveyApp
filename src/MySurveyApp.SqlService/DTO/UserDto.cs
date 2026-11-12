using System.ComponentModel.DataAnnotations;
using MySurveyApp.Shared.Enums;

namespace MySurveyApp.SqlService.DTOs;

/// <summary>
/// Запит для входу або створення анонімного користувача за ключем пристрою
/// </summary>
public record AnonymousAuthRequestDto(
    [Required(ErrorMessage = "Вкажіть ідентифікатор пристрою")]
    string DeviceKey
);

/// <summary>
/// Запит на повноцінну реєстрацію користувача (апгрейд аноніма або новий запис)
/// </summary>
public record RegisterUserRequestDto(
    [Required(ErrorMessage = "Вкажіть ключ пристрою або поточний UserId аноніма")]
    string DeviceKey,

    [Required(ErrorMessage = "Нікнейм є обов'язковим")]
    [MinLength(3, ErrorMessage = "Нікнейм має містити мінімум 3 символи")]
    [MaxLength(100)]
    string Nickname,

    [Required(ErrorMessage = "Пароль є обов'язковим")]
    [MinLength(6, ErrorMessage = "Пароль має містити мінімум 6 символів")]
    string Password,

    [Required(ErrorMessage = "Вкажіть стать")]
    GenderType Gender,

    [Required(ErrorMessage = "Вкажіть рік народження")]
    [Range(1920, 2020, ErrorMessage = "Рік народження має бути в межах 1920–2020")]
    int BirthYear,

    [Required(ErrorMessage = "Вкажіть ID професії")]
    int OccupationId,

    [Required(ErrorMessage = "Вкажіть ID регіону")]
    int RegionId,

    [Required(ErrorMessage = "Вкажіть ID хобі")]
    int HobbyId
);

/// <summary>
/// Запит для входу зареєстрованого користувача за нікнеймом і паролем
/// </summary>
public record LoginRequestDto(
    [Required] string Nickname,
    [Required] string Password
);

/// <summary>
/// Коротка відповідь для анонімного профілю
/// </summary>
public record AnonymousUserResponseDto(
    Guid UserId,
    UserType UserType,
    int AnswersCount,
    int AvailableQuestionTokens
);

/// <summary>
/// Повна інформація про зареєстрованого користувача
/// </summary>
public record UserProfileResponseDto(
    Guid UserId,
    UserType UserType,
    string? Nickname,
    GenderType? Gender,
    int? BirthYear,
    int? RegionId,
    string? RegionName,
    int? OccupationId,
    string? OccupationName,
    int? HobbyId,
    string? HobbyName,
    int AnswersCount,
    int AvailableQuestionTokens
);