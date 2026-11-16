using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySurveyApp.Shared.Enums;
using MySurveyApp.SqlService.Data;      // Замініть на свій неймспейс контексту
using MySurveyApp.SqlService.DTO;
using MySurveyApp.SqlService.Models;    // Замініть на свій неймспейс моделей
using Npgsql;
using System.Security.Claims;


namespace MySurveyApp.SqlService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SurveysController : ControllerBase
    {
        private readonly SurveyDbContext _context;

        public SurveysController(SurveyDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Створити нове опитування (Тільки для авторизованих користувачів з JWT).
        /// </summary>
        [HttpPost]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CreateSurvey([FromBody] CreateSurveyDto dto)
        {
            // 1. Отримання ID автора виключно з JWT-токена
            var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                                  ?? User.FindFirstValue("sub");

            if (string.IsNullOrEmpty(currentUserIdClaim) || !Guid.TryParse(currentUserIdClaim, out Guid authorId))
            {
                return Unauthorized(new { message = "Створювати опитування можуть тільки зареєстровані та авторизовані користувачі." });
            }

            // 2. Валідація тривалості опитування (від 1 дня до 1 року)
            if (dto.DurationDays < 1 || dto.DurationDays > 365)
            {
                return BadRequest(new { message = "Тривалість опитування має бути від 1 до 365 днів (не більше року)." });
            }

            // 3. Безпечний парсинг типу опитування
            if (!Enum.TryParse<SurveyType>(dto.SurveyType, true, out var parsedSurveyType) ||
                !Enum.IsDefined(typeof(SurveyType), parsedSurveyType))
            {
                return BadRequest(new { message = $"Невідомий тип опитування: '{dto.SurveyType}'." });
            }

            // 4. Підготовка варіантів відповідей залежно від типу опитування
            var surveyOptions = new List<SurveyOption>();

            if (parsedSurveyType != SurveyType.Numeric)
            {
                var validOptions = (dto.Options ?? new List<CreateSurveyOptionDto>())
                    .Where(o => !string.IsNullOrWhiteSpace(o.OptionText))
                    .ToList();

                if (validOptions.Count < 2)
                {
                    return BadRequest(new { message = "Для опитування з вибором варіантів потрібно вказати щонайменше 2 відповіді." });
                }

                surveyOptions = validOptions
                    .Select((o, idx) => new SurveyOption
                    {
                        OptionText = o.OptionText.Trim(),
                        OrderIndex = o.OrderIndex >= 0 ? o.OrderIndex : idx
                    })
                    .ToList();
            }

            // 5. Формування сутності опитування з розрахунком дати завершення в UTC
            var nowUtc = DateTime.UtcNow;

            var newSurvey = new Survey
            {
                AuthorId = authorId,
                SurveyText = dto.SurveyText.Trim(),
                SurveyType = parsedSurveyType,
                TopicId = dto.TopicId,
                RegionTargetId = dto.RegionTargetId is > 0 ? dto.RegionTargetId : null,
                Status = SurveyStatus.Pending,
                CreatedAt = nowUtc,
                ExpiresAt = nowUtc.AddDays(dto.DurationDays),
                SurveyOptions = surveyOptions
            };

            // 6. Збереження в базі даних та перехоплення тригера токенів
            try
            {
                _context.Surveys.Add(newSurvey);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Опитування успішно створено!",
                    surveyId = newSurvey.SurveyId,
                    expiresAt = newSurvey.ExpiresAt
                });
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "P0001")
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = pgEx.MessageText });
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Внутрішня помилка сервера.",
                    details = innerMessage
                });
            }
        }

        /// <summary>
        /// Повне редагування та зміна статусу опитування (Тільки для Admin та Moderator).
        /// Підтримує схвалення (Active), відхилення з причиною (Rejected) та архівацію (Archived).
        /// </summary>
        [HttpPatch("{surveyId:int}/moderate")]
        public async Task<IActionResult> ModerateSurvey(int surveyId, [FromBody] UpdateSurveyByModeratorDto dto)
        {
            // 1. Перевірка прав доступу
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (userRole != "Admin" && userRole != "Moderator")
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { message = "Тільки модератори та адміністратори можуть редагувати опитування." });
            }

            // 2. Пошук опитування РАЗОМ із його варіантами відповідей
            var survey = await _context.Surveys
                .Include(s => s.SurveyOptions)
                .FirstOrDefaultAsync(s => s.SurveyId == surveyId);

            if (survey == null)
            {
                return NotFound(new { message = $"Опитування з ID {surveyId} не знайдено." });
            }

            bool isUpdated = false;

            // 3. Оновлення текстових та числових полів
            if (!string.IsNullOrWhiteSpace(dto.SurveyText))
            {
                survey.SurveyText = dto.SurveyText;
                isUpdated = true;
            }

            if (!string.IsNullOrWhiteSpace(dto.SurveyType))
            {
                if (Enum.TryParse<SurveyType>(dto.SurveyType, true, out var newType))
                {
                    survey.SurveyType = newType;
                    isUpdated = true;
                }
            }

            if (dto.TopicId.HasValue)
            {
                survey.TopicId = dto.TopicId.Value;
                isUpdated = true;
            }

            if (dto.RegionTargetId.HasValue)
            {
                survey.RegionTargetId = dto.RegionTargetId.Value;
                isUpdated = true;
            }

            if (dto.ExpiresAt.HasValue)
            {
                survey.ExpiresAt = dto.ExpiresAt.Value.ToUniversalTime();
                isUpdated = true;
            }

            // 4. Оновлення статусу та причини відхилення (FR 6.2, FR 6.3)
            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                if (!Enum.TryParse<SurveyStatus>(dto.Status, true, out var parsedStatus) ||
                    !Enum.IsDefined(typeof(SurveyStatus), parsedStatus))
                {
                    return BadRequest(new { message = $"Невідомий статус опитування: '{dto.Status}'." });
                }

                // Якщо модератор відхиляє опитування — вимагаємо вказати причину
                if (parsedStatus == SurveyStatus.Rejected)
                {
                    if (string.IsNullOrWhiteSpace(dto.RejectionReason))
                    {
                        return BadRequest(new { message = "При відхиленні опитування необхідно вказати причину (rejectionReason)." });
                    }
                    survey.RejectionReason = dto.RejectionReason.Trim();
                }
                else if (parsedStatus == SurveyStatus.Active)
                {
                    // Якщо опитування схвалено — очищаємо стару причину відхилення, якщо вона була
                    survey.RejectionReason = null;
                }

                survey.Status = parsedStatus;
                isUpdated = true; // Виправлено: тепер зміна статусу гарантовано зберігається в БД
            }
            else if (dto.RejectionReason != null)
            {
                // Якщо статус не передано, але модератор відредагував текст причини відхилення
                survey.RejectionReason = string.IsNullOrWhiteSpace(dto.RejectionReason)
                    ? null
                    : dto.RejectionReason.Trim();
                isUpdated = true;
            }

            // 5. Оновлення варіантів відповідей (якщо вони передані)
            if (survey.SurveyType == SurveyType.Numeric)
            {
                if (survey.SurveyOptions.Any())
                {
                    _context.Set<SurveyOption>().RemoveRange(survey.SurveyOptions);
                    isUpdated = true;
                }
            }
            else if (dto.Options != null && dto.Options.Any())
            {
                _context.Set<SurveyOption>().RemoveRange(survey.SurveyOptions);

                survey.SurveyOptions = dto.Options.Select(o => new SurveyOption
                {
                    OptionText = o.OptionText,
                    OrderIndex = o.OrderIndex,
                    SurveyId = survey.SurveyId
                }).ToList();

                isUpdated = true;
            }

            // 6. Збереження змін
            if (isUpdated)
            {
                try
                {
                    await _context.SaveChangesAsync();
                    return Ok(new
                    {
                        message = "Опитування успішно оновлено модератором.",
                        status = survey.Status.ToString(),
                        rejectionReason = survey.RejectionReason
                    });
                }
                catch (Exception)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Внутрішня помилка при збереженні." });
                }
            }

            return Ok(new { message = "Не передано жодних нових даних для оновлення." });
        }

        /// <summary>
        /// Отримати випадкове активне опитування за темою та регіоном,
        /// на яке користувач ще НЕ відповідав.
        /// </summary>
        [HttpGet("random")]
        [ProducesResponseType(typeof(RandomSurveyDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<RandomSurveyDto>> GetRandomSurvey(
            [FromQuery] int? topicId,
            [FromQuery] int? excludeTopicId,
            [FromQuery] int? regionId)
        {
            var anonTokenHeader = Request.Headers["X-Anonymous-Token"].FirstOrDefault();
            var deviceKeyHeader = Request.Headers["X-Device-Key"].FirstOrDefault();
            var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

            Guid userId;
            if (!string.IsNullOrEmpty(currentUserIdClaim) && Guid.TryParse(currentUserIdClaim, out Guid authId))
            {
                userId = authId;
            }
            else if (!string.IsNullOrWhiteSpace(anonTokenHeader) && Guid.TryParse(anonTokenHeader, out Guid anonId))
            {
                userId = anonId;
            }
            else if (!string.IsNullOrWhiteSpace(deviceKeyHeader))
            {
                userId = GenerateGuidFromDeviceKey(deviceKeyHeader);
            }
            else
            {
                return Unauthorized(new { message = "Необхідно передати JWT токен або заголовок X-Device-Key." });
            }

            var query = _context.Surveys
                .AsNoTracking()
                .Include(s => s.SurveyOptions)
                .Where(s => s.Status == SurveyStatus.Active
                         && s.ExpiresAt > DateTime.UtcNow);

            if (topicId.HasValue && topicId.Value > 0)
            {
                query = query.Where(s => s.TopicId == topicId.Value);
            }
            else if (excludeTopicId.HasValue && excludeTopicId.Value > 0)
            {
                query = query.Where(s => s.TopicId != excludeTopicId.Value);
            }

            if (regionId.HasValue)
            {
                query = query.Where(s => s.RegionTargetId == regionId.Value || s.RegionTargetId == null);
            }
            else
            {
                query = query.Where(s => s.RegionTargetId == null);
            }

            query = query.Where(s => !_context.Set<SurveyInteraction>()
                .Any(si => si.SurveyId == s.SurveyId && si.UserId == userId));

            var randomSurvey = await query
                .OrderBy(s => EF.Functions.Random())
                .FirstOrDefaultAsync();

            if (randomSurvey == null)
            {
                return NotFound(new { message = "Немає нових доступних опитувань для вибраної теми та регіону." });
            }

            return Ok(new RandomSurveyDto(
                SurveyId: randomSurvey.SurveyId,
                SurveyText: randomSurvey.SurveyText,
                SurveyType: randomSurvey.SurveyType.ToString(),
                TopicId: randomSurvey.TopicId,
                Options: randomSurvey.SurveyOptions
                    .OrderBy(o => o.OrderIndex)
                    .Select(o => new SurveyOptionDto(o.OptionId, o.OptionText))
                    .ToList()
            ));
        }

        /// <summary>
        /// Отримати список опитувань, які створив поточний автентифікований користувач
        /// </summary>
        [HttpGet("my")]
        public async Task<IActionResult> GetMySurveys()
        {
            // 1. Отримуємо ID поточного користувача з його JWT токена
            var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

            if (string.IsNullOrEmpty(currentUserIdClaim) || !Guid.TryParse(currentUserIdClaim, out Guid authorId))
            {
                return Unauthorized(new { message = "Необхідно авторизуватися, щоб переглянути свої опитування." });
            }

            // 2. Шукаємо в базі тільки ті опитування, де author_id збігається з ID юзера
            var surveys = await _context.Surveys
                .Include(s => s.SurveyOptions)
                .Where(s => s.AuthorId == authorId)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    surveyId = s.SurveyId,
                    surveyText = s.SurveyText,
                    surveyType = s.SurveyType.ToString(),
                    status = s.Status.ToString(), // Показуємо статус (Pending, Active тощо)
                    topicId = s.TopicId,
                    regionTargetId = s.RegionTargetId,
                    createdAt = s.CreatedAt,
                    expiresAt = s.ExpiresAt,
                    options = s.SurveyOptions.OrderBy(o => o.OrderIndex).Select(o => new
                    {
                        optionId = o.OptionId,
                        optionText = o.OptionText
                    })
                })
                .ToListAsync();

            return Ok(surveys);
        }

        /// <summary>
        /// Отримати список опитувань із вказаним статусом (Pending, Active, Rejected, Archived, Closed) з пагінацією.
        /// Тільки для Admin та Moderator.
        /// </summary>
        [HttpGet("moderation")]
        public async Task<IActionResult> GetSurveysForModeration(
            [FromQuery] string status = "Pending",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // 1. Перевірка прав доступу (JWT)
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (userRole != "Admin" && userRole != "Moderator")
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { message = "Тільки модератори та адміністратори можуть переглядати опитування для модерації." });
            }

            // 2. Валідація статусу з enum SurveyStatus
            if (!Enum.TryParse<SurveyStatus>(status, true, out var parsedStatus) ||
                !Enum.IsDefined(typeof(SurveyStatus), parsedStatus))
            {
                return BadRequest(new { message = $"Невідомий статус опитування: '{status}'." });
            }

            // 3. Захист від невалідних параметрів пагінації
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            // 4. Базовий запит за обраним статусом
            var query = _context.Surveys
                .AsNoTracking()
                .Include(s => s.SurveyOptions)
                .Where(s => s.Status == parsedStatus);

            // 5. Підрахунок загальної кількості
            var totalItems = await query.CountAsync();

            // 6. Для черги Pending показуємо спочатку старіші, для інших статусів — новіші
            var orderedQuery = parsedStatus == SurveyStatus.Pending
                ? query.OrderBy(s => s.CreatedAt)
                : query.OrderByDescending(s => s.CreatedAt);

            var surveys = await orderedQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new
                {
                    surveyId = s.SurveyId,
                    surveyText = s.SurveyText,
                    surveyType = s.SurveyType.ToString(),
                    status = s.Status.ToString(),
                    rejectionReason = s.RejectionReason,
                    authorId = s.AuthorId,
                    topicId = s.TopicId,
                    regionTargetId = s.RegionTargetId,
                    createdAt = s.CreatedAt,
                    expiresAt = s.ExpiresAt,
                    options = s.SurveyOptions.OrderBy(o => o.OrderIndex).Select(o => new
                    {
                        optionId = o.OptionId,
                        optionText = o.OptionText,
                        orderIndex = o.OrderIndex
                    })
                })
                .ToListAsync();

            var result = new
            {
                currentPage = page,
                pageSize = pageSize,
                totalItems = totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                items = surveys
            };

            return Ok(result);
        }

        /// <summary>
        /// Почати відстеження опитування (додати в закладки)
        /// </summary>
        [HttpPost("{surveyId:int}/bookmark")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AddBookmark(int surveyId)
        {
            var userId = GetCurrentUserIdOrAnonymous();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Необхідно передати JWT токен або заголовок ідентифікації пристрою." });

            var surveyExists = await _context.Surveys.AnyAsync(s => s.SurveyId == surveyId);
            if (!surveyExists)
                return NotFound(new { message = $"Опитування з ID {surveyId} не знайдено." });

            var exists = await _context.Set<SurveyBookmark>()
                .AnyAsync(b => b.UserId == userId && b.SurveyId == surveyId);

            if (!exists)
            {
                _context.Set<SurveyBookmark>().Add(new SurveyBookmark
                {
                    UserId = userId,
                    SurveyId = surveyId
                });
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Опитування додано до відстежуваних." });
        }

        /// <summary>
        /// Перестати відстежувати опитування (видалити з закладок)
        /// </summary>
        [HttpDelete("{surveyId:int}/bookmark")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RemoveBookmark(int surveyId)
        {
            var userId = GetCurrentUserIdOrAnonymous();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Необхідно передати JWT токен або заголовок ідентифікації пристрою." });

            var bookmark = await _context.Set<SurveyBookmark>()
                .FirstOrDefaultAsync(b => b.UserId == userId && b.SurveyId == surveyId);

            if (bookmark != null)
            {
                _context.Set<SurveyBookmark>().Remove(bookmark);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Опитування видалено з відстежуваних." });
        }

        /// <summary>
        /// Отримати список усіх відстежуваних опитувань поточного користувача
        /// </summary>
        [HttpGet("bookmarks")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetBookmarkedSurveys()
        {
            var userId = GetCurrentUserIdOrAnonymous();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Необхідно передати JWT токен або заголовок ідентифікації пристрою." });

            var surveys = await _context.Set<SurveyBookmark>()
                .AsNoTracking()
                .Where(b => b.UserId == userId)
                .Include(b => b.Survey)
                    .ThenInclude(s => s!.SurveyOptions)
                .Select(b => new
                {
                    surveyId = b.Survey!.SurveyId,
                    surveyText = b.Survey.SurveyText,
                    surveyType = b.Survey.SurveyType.ToString(),
                    status = b.Survey.Status.ToString(),
                    createdAt = b.Survey.CreatedAt,
                    expiresAt = b.Survey.ExpiresAt,
                    options = b.Survey.SurveyOptions.OrderBy(o => o.OrderIndex).Select(o => new
                    {
                        optionId = o.OptionId,
                        optionText = o.OptionText
                    })
                })
                .ToListAsync();

            return Ok(surveys);
        }

        // --- Внутрішній хелпер для визначення UserId ( JWT / AnonymousToken / DeviceKey ) ---
        private Guid GetCurrentUserIdOrAnonymous()
        {
            var anonTokenHeader = Request.Headers["X-Anonymous-Token"].FirstOrDefault();
            var deviceKeyHeader = Request.Headers["X-Device-Key"].FirstOrDefault();
            var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

            if (!string.IsNullOrEmpty(currentUserIdClaim) && Guid.TryParse(currentUserIdClaim, out Guid authId))
            {
                return authId;
            }
            if (!string.IsNullOrWhiteSpace(anonTokenHeader) && Guid.TryParse(anonTokenHeader, out Guid anonId))
            {
                return anonId;
            }
            if (!string.IsNullOrWhiteSpace(deviceKeyHeader))
            {
                using var md5 = System.Security.Cryptography.MD5.Create();
                byte[] hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(deviceKeyHeader));
                return new Guid(hash);
            }

            return Guid.Empty;
        }

        [HttpGet("{surveyId:int}/bookmark/status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetBookmarkStatus(int surveyId)
        {
            var userId = GetCurrentUserIdOrAnonymous();
            if (userId == Guid.Empty)
                return Ok(new { isBookmarked = false });

            var isBookmarked = await _context.Set<SurveyBookmark>()
                .AnyAsync(b => b.UserId == userId && b.SurveyId == surveyId);

            return Ok(new { isBookmarked });
        }

        // Хелпер для генерації Guid з X-Device-Key (як у UsersController)
        // Якщо він у вас винесений в окремий сервіс, просто викличте його звідти
        private Guid GenerateGuidFromDeviceKey(string deviceKey)
        {
            using (var md5 = System.Security.Cryptography.MD5.Create())
            {
                byte[] hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(deviceKey));
                return new Guid(hash);
            }
        }


    }
}