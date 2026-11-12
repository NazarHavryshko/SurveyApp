using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MySurveyApp.Shared.Enums;
using MySurveyApp.SqlService.Data;
using MySurveyApp.SqlService.DTOs;
using MySurveyApp.SqlService.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MySurveyApp.SqlService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly SurveyDbContext _context;

    public UsersController(SurveyDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Увійти або створити анонімного користувача за ключем пристрою (DeviceKey -> UserId)
    /// </summary>
    [HttpPost("anonymous")]
    [ProducesResponseType(typeof(AnonymousUserResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AnonymousUserResponseDto>> GetOrCreateAnonymous([FromBody] AnonymousAuthRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DeviceKey))
        {
            return BadRequest("DeviceKey не може бути порожнім.");
        }

        Guid userId = GenerateGuidFromDeviceKey(dto.DeviceKey);
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            user = new User
            {
                UserId = userId,
                UserType = UserType.Anonymous,
                AnswersCount = 0,
                AvailableQuestionTokens = 0
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        return Ok(new AnonymousUserResponseDto(
            user.UserId,
            user.UserType,
            user.AnswersCount,
            user.AvailableQuestionTokens
        ));
    }

    /// <summary>
    /// Зареєструвати користувача (оновлює існуючий анонімний профіль пристрою або створює новий)
    /// </summary>
    /// <remarks>
    /// Всі накопичені анонімом відповіді (AnswersCount) та токени питань (AvailableQuestionTokens) зберігаються!
    /// </remarks>
    [HttpPost("register")]
    [ProducesResponseType(typeof(UserProfileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserProfileResponseDto>> Register([FromBody] RegisterUserRequestDto dto)
    {
        // 1. Перевіряємо, чи не зайнятий вже такий нікнейм
        string normalizedNickname = dto.Nickname.Trim();
        bool nicknameExists = await _context.Users
            .AnyAsync(u => u.Nickname != null && u.Nickname.ToLower() == normalizedNickname.ToLower());

        if (nicknameExists)
        {
            return Conflict(new { message = $"Нікнейм '{normalizedNickname}' вже зайнятий." });
        }

        // 2. Перевіряємо валідність довідників (чи існують такі ID в базі)
        if (!await _context.Regions.AnyAsync(r => r.RegionId == dto.RegionId))
            return BadRequest(new { message = $"Регіон з ID {dto.RegionId} не знайдено." });

        if (!await _context.Occupations.AnyAsync(o => o.OccupationId == dto.OccupationId))
            return BadRequest(new { message = $"Професію з ID {dto.OccupationId} не знайдено." });

        if (!await _context.Hobbies.AnyAsync(h => h.HobbyId == dto.HobbyId))
            return BadRequest(new { message = $"Хобі з ID {dto.HobbyId} не знайдено." });

        // 3. Знаходимо існуючий анонімний профіль за DeviceKey (або UserId)
        Guid userId = GenerateGuidFromDeviceKey(dto.DeviceKey);
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            // Якщо користувач реєструється одразу без попереднього анонімного входу
            user = new User
            {
                UserId = userId,
                AnswersCount = 0,
                AvailableQuestionTokens = 0
            };
            _context.Users.Add(user);
        }
        else if (user.UserType != UserType.Anonymous)
        {
            return Conflict(new { message = "Цей пристрій вже зареєстровано за іншим профілем." });
        }

        // 4. Заповнюємо всі анкетні поля та змінюємо тип користувача
        // (Підстав своє значення enum замість UserType.User, якщо воно називається UserType.Registered)
        user.UserType = Enum.GetValues<UserType>().FirstOrDefault(t => t != UserType.Anonymous);
        user.Nickname = normalizedNickname;
        user.PasswordHash = HashPassword(dto.Password);
        user.Gender = dto.Gender;
        user.BirthYear = dto.BirthYear;
        user.OccupationId = dto.OccupationId;
        user.RegionId = dto.RegionId;
        user.HobbyId = dto.HobbyId;

        await _context.SaveChangesAsync();

        // 5. Повертаємо повний профіль із підтягнутими назвами довідників
        return await GetById(user.UserId);
    }

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Region)
            .Include(u => u.Occupation)
            .Include(u => u.Hobby)
            .FirstOrDefaultAsync(u => u.Nickname != null && u.Nickname.ToLower() == dto.Nickname.Trim().ToLower());

        if (user == null || user.PasswordHash == null || !VerifyPassword(dto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Невірний нікнейм або пароль." });
        }

        // 1. Секретний ключ (має збігатися з ключем у Program.cs)
        var secretKey = "YOUR_SUPER_SECRET_KEY_FOR_JWT_SURVEY_APP_2026!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 2. Створення Claims (ідентифікатор та роль користувача)
        var claims = new[]
        {
        new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
        new Claim(ClaimTypes.Name, user.Nickname ?? string.Empty),
        new Claim(ClaimTypes.Role, user.UserType.ToString())
    };

        // 3. Генерація токена
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var securityToken = tokenHandler.CreateToken(tokenDescriptor);
        string realJwtToken = tokenHandler.WriteToken(securityToken);

        // 4. Формування відповіді профілю
        var userProfile = new UserProfileResponseDto(
            user.UserId,
            user.UserType,
            user.Nickname,
            user.Gender,
            user.BirthYear,
            user.RegionId,
            user.Region?.RegionName,
            user.OccupationId,
            user.Occupation?.OccupationName,
            user.HobbyId,
            user.Hobby?.HobbyName,
            user.AnswersCount,
            user.AvailableQuestionTokens
        );

        // 5. Повертаємо справжній токен замість рядка-заглушки
        return Ok(new
        {
            message = "Успішний вхід",
            token = realJwtToken,
            user = userProfile
        });
    }

    /// <summary>
    /// Отримати повний профіль користувача за його UserId
    /// </summary>
    /// <remarks>
    /// Доступно зареєстрованому власнику / Admin / Moderator (через JWT),
    /// а якщо токен відсутній — власнику анонімного профілю (через X-Device-Key).
    /// </remarks>
    [HttpGet("{userId:guid}")]
    [ProducesResponseType(typeof(UserProfileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserProfileResponseDto>> GetById(Guid userId)
    {
        var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        var currentUserRole = User.FindFirstValue(ClaimTypes.Role);
        var deviceKeyHeader = Request.Headers["X-Device-Key"].FirstOrDefault();

        // СПОЧАТКУ ПЕРЕВІРЯЄМО JWT ТОКЕН (якщо користувач автентифікований)
        if (!string.IsNullOrEmpty(currentUserIdClaim) && Guid.TryParse(currentUserIdClaim, out Guid authUserId))
        {
            bool isAdminOrModerator = currentUserRole == "Admin" || currentUserRole == "Moderator";

            // Доступ дозволено, якщо це власник профілю або адміністратор/модератор
            if (!isAdminOrModerator && authUserId != userId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Доступ до чужого профілю заборонено." });
            }
        }
        // ЯКЩО ТОКЕН НЕ НАДАНО — ПЕРЕВІРЯЄМО X-Device-Key (анонімний власник)
        else if (!string.IsNullOrWhiteSpace(deviceKeyHeader))
        {
            Guid expectedUserId = GenerateGuidFromDeviceKey(deviceKeyHeader);

            if (expectedUserId != userId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Доступ до чужого профілю заборонено." });
            }
        }
        // ЯКЩО НЕ НАДАНО АНІ ТОКЕНА, АНІ X-Device-Key
        else
        {
            return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Необхідно надати JWT токен або заголовок X-Device-Key." });
        }

        // Отримання даних з бази, якщо перевірку пройдено
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Region)
            .Include(u => u.Occupation)
            .Include(u => u.Hobby)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
        {
            return NotFound(new { message = $"Користувача з ID {userId} не знайдено." });
        }

        return Ok(new UserProfileResponseDto(
            user.UserId,
            user.UserType,
            user.Nickname,
            user.Gender,
            user.BirthYear,
            user.RegionId,
            user.Region?.RegionName,
            user.OccupationId,
            user.Occupation?.OccupationName,
            user.HobbyId,
            user.Hobby?.HobbyName,
            user.AnswersCount,
            user.AvailableQuestionTokens
        ));
    }

    // --- Допоміжні методи ---

    private static Guid GenerateGuidFromDeviceKey(string deviceKey)
    {
        if (Guid.TryParse(deviceKey, out var parsedGuid))
        {
            return parsedGuid;
        }

        byte[] inputBytes = Encoding.UTF8.GetBytes(deviceKey.Trim().ToLowerInvariant());
        byte[] hashBytes = MD5.HashData(inputBytes);
        return new Guid(hashBytes);
    }

    private static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split('.');
        if (parts.Length != 2) return false;

        byte[] salt = Convert.FromBase64String(parts[0]);
        byte[] expectedHash = Convert.FromBase64String(parts[1]);
        byte[] actualHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);

        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
}