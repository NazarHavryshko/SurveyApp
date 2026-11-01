using Microsoft.EntityFrameworkCore;
using MySurveyApp.Shared.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySurveyApp.SqlService.Models
{
    [Table("users")]
    [Index(nameof(Nickname), IsUnique = true)]
    public class User
    {
        [Key]
        [Column("user_id")]
        public Guid UserId { get; set; } = Guid.NewGuid();

        [Required]
        [Column("user_type")]
        public UserType UserType { get; set; }  = UserType.Anonymous;

        [MaxLength(100)]
        [Column("nickname")]
        public string? Nickname { get; set; }

        [MaxLength(255)]
        [Column("password_hash")]
        public string? PasswordHash { get; set; }

        [MaxLength(10)]
        [Column("gender")]
        public GenderType? Gender { get; set; }

        [Column("birth_year")]
        public int? BirthYear { get; set; }

        [Column("occupation_id")]
        public int? OccupationId { get; set; }

        [Column("region_id")]
        public int? RegionId { get; set; }

        [Column("hobby_id")]
        public int? HobbyId { get; set; }

        [Column("answers_count")]
        public int AnswersCount { get; set; } = 0;

        [Column("available_question_tokens")]
        public int AvailableQuestionTokens { get; set; } = 0;



        [ForeignKey(nameof(OccupationId))]
        public virtual Occupation? Occupation { get; set; }

        [ForeignKey(nameof(HobbyId))]
        public virtual Hobby? Hobby { get; set; }

        [ForeignKey(nameof(RegionId))]
        public virtual Region? Region { get; set; }

    }
}
