using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MySurveyApp.NoSqlService.DTO;
using MySurveyApp.NoSqlService.Models;

namespace MySurveyApp.NoSqlService.Controllers;

[Route("api/internal/surveys/{surveyId:int}/comments")]
[ApiController]
public class CommentsController : ControllerBase
{
    private readonly IMongoCollection<SurveyCommentDocument> _commentsCollection;

    public CommentsController(IMongoCollection<SurveyCommentDocument> mongoDatabase)
    {
        // Явно вказуємо назву колекції у стилі snake_case: survey_comments
        _commentsCollection = mongoDatabase.Database.GetCollection<SurveyCommentDocument>("survey_comments");
    }

    /// <summary>
    /// Отримати дерево коментарів опитування (доступно всім)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(SurveyCommentDocument), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetComments(int surveyId, CancellationToken cancellationToken)
    {
        var filter = Builders<SurveyCommentDocument>.Filter.Eq(d => d.SurveyId, surveyId);
        var document = await _commentsCollection.Find(filter).FirstOrDefaultAsync(cancellationToken);

        if (document == null)
        {
            // Якщо документів ще немає, повертаємо порожню структуру
            return Ok(new SurveyCommentDocument
            {
                SurveyId = surveyId,
                NextCommentId = 0,
                Comments = new()
            });
        }

        return Ok(document);
    }

    /// <summary>
    /// Додати коментар або підкоментар (відповідь) — вимагає авторизації
    /// </summary>
    [Authorize]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddComment(
        int surveyId,
        [FromBody] CreateCommentDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
        {
            return BadRequest(new { message = "Текст коментаря не може бути порожнім." });
        }

        // Витягуємо нікнейм або ім'я користувача з токена
        var nickname = User.FindFirstValue(ClaimTypes.Name)
                       ?? User.FindFirstValue("nickname")
                       ?? User.FindFirstValue(ClaimTypes.Email)?.Split('@')[0]
                       ?? "Користувач";

        var filter = Builders<SurveyCommentDocument>.Filter.Eq(d => d.SurveyId, surveyId);
        var document = await _commentsCollection.Find(filter).FirstOrDefaultAsync(cancellationToken);

        if (document == null)
        {
            // Створюємо документ для опитування, якщо його ще не було
            document = new SurveyCommentDocument
            {
                SurveyId = surveyId,
                NextCommentId = 0,
                Comments = new()
            };
            await _commentsCollection.InsertOneAsync(document, cancellationToken: cancellationToken);
        }

        if (dto.ParentCommentId == null)
        {
            // Додаємо кореневий коментар
            var newComment = new CommentItem
            {
                CommentId = document.NextCommentId,
                CreatedAt = DateTime.UtcNow,
                Text = dto.Text.Trim(),
                Nickname = nickname,
                NextReplyId = 0,
                Replies = new()
            };

            var update = Builders<SurveyCommentDocument>.Update
                .Push(d => d.Comments, newComment)
                .Inc(d => d.NextCommentId, 1);

            await _commentsCollection.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
        }
        else
        {
            // Додаємо підкоментар (відповідь на конкретний comment_id)
            var parentId = dto.ParentCommentId.Value;
            var targetComment = document.Comments.FirstOrDefault(c => c.CommentId == parentId);

            if (targetComment == null)
            {
                return BadRequest(new { message = $"Батьківський коментар з ID {parentId} не знайдено." });
            }

            var newReply = new ReplyItem
            {
                ReplyId = targetComment.NextReplyId,
                CreatedAt = DateTime.UtcNow,
                Text = dto.Text.Trim(),
                Nickname = nickname
            };

            // Оновлюємо конкретний елемент у масиві comments через позиційний оператор $
            var updateFilter = Builders<SurveyCommentDocument>.Filter.And(
                Builders<SurveyCommentDocument>.Filter.Eq(d => d.SurveyId, surveyId),
                Builders<SurveyCommentDocument>.Filter.Eq("comments.comment_id", parentId)
            );

            var update = Builders<SurveyCommentDocument>.Update
                .Push("comments.$.replies", newReply)
                .Inc("comments.$.next_reply_id", 1);

            await _commentsCollection.UpdateOneAsync(updateFilter, update, cancellationToken: cancellationToken);
        }

        return Ok(new { message = "Коментар успішно додано." });
    }

    /// <summary>
    /// Видалити коментар або підкоментар (для модераторів/адмінів)
    /// </summary>
    [Authorize(Roles = "Moderator,Admin")]
    [HttpDelete("{commentId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteComment(
        int surveyId,
        int commentId,
        [FromQuery] int? replyId = null,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<SurveyCommentDocument>.Filter.Eq(d => d.SurveyId, surveyId);
        var document = await _commentsCollection.Find(filter).FirstOrDefaultAsync(cancellationToken);

        if (document == null)
        {
            return NotFound(new { message = "Коментарі для цього опитування не знайдені." });
        }

        if (replyId == null)
        {
            // Видаляємо весь кореневий коментар разом із підкоментарями
            var update = Builders<SurveyCommentDocument>.Update
                .PullFilter(d => d.Comments, c => c.CommentId == commentId);

            await _commentsCollection.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
        }
        else
        {
            // Видаляємо конкретний підкоментар (reply) всередині коментаря
            var updateFilter = Builders<SurveyCommentDocument>.Filter.And(
                Builders<SurveyCommentDocument>.Filter.Eq(d => d.SurveyId, surveyId),
                Builders<SurveyCommentDocument>.Filter.Eq("comments.comment_id", commentId)
            );

            var update = Builders<SurveyCommentDocument>.Update
                .PullFilter("comments.$.replies", Builders<ReplyItem>.Filter.Eq(r => r.ReplyId, replyId.Value));

            await _commentsCollection.UpdateOneAsync(updateFilter, update, cancellationToken: cancellationToken);
        }

        return Ok(new { message = "Коментар успішно видалено." });
    }
}