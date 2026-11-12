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
        [Authorize] // Захист ендпоінта на рівні JWT-схеми
        [ProducesResponseType(StatusCodes.Status200OK)]
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

            // 2. Формування сутності опитування
            var newSurvey = new Survey
            {
                AuthorId = authorId,
                SurveyText = dto.SurveyText,
                SurveyType = Enum.Parse<SurveyType>(dto.SurveyType, true),
                TopicId = dto.TopicId,
                RegionTargetId = dto.RegionTargetId,
                Status = SurveyStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = dto.ExpiresAt.ToUniversalTime(),
                SurveyOptions = dto.Options.Select(o => new SurveyOption
                {
                    OptionText = o.OptionText,
                    OrderIndex = o.OrderIndex
                }).ToList()
            };

            // 3. Збереження в базі даних та перехоплення тригера токенів
            try
            {
                _context.Surveys.Add(newSurvey);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Опитування успішно створено!",
                    surveyId = newSurvey.SurveyId
                });
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "P0001")
            {
                // Недостатньо токенів для створення опитування
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
        /// Повне редагування опитування (Тільки для Admin та Moderator).
        /// Дозволяє змінити будь-яке поле, включаючи варіанти відповідей.
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

            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                if (Enum.TryParse<SurveyStatus>(dto.Status, true, out var newStatus))
                {
                    survey.Status = newStatus;
                    isUpdated = true;
                }
            }

            // 4. Оновлення варіантів відповідей (якщо вони передані)
            if (dto.Options != null && dto.Options.Any())
            {
                // Видаляємо старі варіанти з бази даних
                _context.Set<SurveyOption>().RemoveRange(survey.SurveyOptions);

                // Додаємо нові варіанти
                survey.SurveyOptions = dto.Options.Select(o => new SurveyOption
                {
                    OptionText = o.OptionText,
                    OrderIndex = o.OrderIndex,
                    SurveyId = survey.SurveyId
                }).ToList();

                isUpdated = true;
            }

            // 5. Збереження змін
            if (isUpdated)
            {
                try
                {
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Опитування успішно відредаговано модератором." });
                }
                catch (Exception ex)
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
        public async Task<IActionResult> GetRandomSurvey([FromQuery] int topicId, [FromQuery] int? regionId)
        {
            // 1. Ідентифікація користувача
            var deviceKeyHeader = Request.Headers["X-Device-Key"].FirstOrDefault();
            var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

            Guid userId;
            if (!string.IsNullOrEmpty(currentUserIdClaim) && Guid.TryParse(currentUserIdClaim, out Guid authId))
            {
                userId = authId;
            }
            else if (!string.IsNullOrWhiteSpace(deviceKeyHeader))
            {
                userId = GenerateGuidFromDeviceKey(deviceKeyHeader);
            }
            else
            {
                return Unauthorized(new { message = "Необхідно передати JWT токен або заголовок X-Device-Key." });
            }

            // 2. Побудова базового запиту: тільки активні та не прострочені
            var query = _context.Surveys
                .Include(s => s.SurveyOptions) // Обов'язково підтягуємо варіанти відповідей
                .Where(s => s.Status == SurveyStatus.Active
                         && s.ExpiresAt > DateTime.UtcNow
                         && s.TopicId == topicId);

            // 3. Фільтрація за регіоном
            // Якщо передано регіон, шукаємо опитування для цього регіону АБО загальнонаціональні (RegionTargetId == null)
            if (regionId.HasValue)
            {
                query = query.Where(s => s.RegionTargetId == regionId.Value || s.RegionTargetId == null);
            }
            else
            {
                // Якщо юзер не має регіону, показуємо тільки загальнонаціональні
                query = query.Where(s => s.RegionTargetId == null);
            }

            // 4. ВІДСІЮВАННЯ ТИХ, НА ЯКІ ВЖЕ ВІДПОВІВ
            // EF Core перетворить це на ефективний SQL-оператор NOT EXISTS (...)
            query = query.Where(s => !_context.Set<SurveyInteraction>()
                .Any(si => si.SurveyId == s.SurveyId && si.UserId == userId));

            // 5. Вибір ВИПАДКОВОГО опитування з тих, що залишились
            var randomSurvey = await query
                .OrderBy(s => EF.Functions.Random())
                .FirstOrDefaultAsync();

            if (randomSurvey == null)
            {
                return NotFound(new { message = "Немає нових доступних опитувань для вибраної теми та регіону." });
            }

            // 6. Формування зручної відповіді для клієнта
            var result = new
            {
                surveyId = randomSurvey.SurveyId,
                surveyText = randomSurvey.SurveyText,
                surveyType = randomSurvey.SurveyType.ToString(),
                topicId = randomSurvey.TopicId,
                // Сортуємо опції так, як їх задав автор
                options = randomSurvey.SurveyOptions.OrderBy(o => o.OrderIndex).Select(o => new
                {
                    optionId = o.OptionId,
                    optionText = o.OptionText
                })
            };

            return Ok(result);
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
        /// Отримати список опитувань, які очікують модерації (Pending), з пагінацією.
        /// Тільки для Admin та Moderator.
        /// </summary>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingSurveys([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            // 1. Перевірка прав доступу (JWT)
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (userRole != "Admin" && userRole != "Moderator")
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { message = "Тільки модератори та адміністратори можуть переглядати опитування на модерацію." });
            }

            // 2. Захист від невалідних параметрів пагінації
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100; // Обмежуємо максимум 100 елементів на сторінку

            // 3. Базовий запит: вибираємо тільки опитування зі статусом Pending
            var query = _context.Surveys
                .Include(s => s.SurveyOptions)
                .Where(s => s.Status == SurveyStatus.Pending);

            // 4. Підрахунок загальної кількості таких опитувань (для розрахунку сторінок на клієнті)
            var totalItems = await query.CountAsync();

            // 5. Застосування пагінації (Skip / Take) та сортування (спочатку старіші)
            var surveys = await query
                .OrderBy(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new
                {
                    surveyId = s.SurveyId,
                    surveyText = s.SurveyText,
                    surveyType = s.SurveyType.ToString(),
                    authorId = s.AuthorId,
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

            // 6. Формуємо зручний об'єкт відповіді з метаданими пагінації
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