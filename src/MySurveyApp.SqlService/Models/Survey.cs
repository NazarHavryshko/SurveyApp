using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MySurveyApp.Shared.Enums;

namespace MySurveyApp.SqlService.Models
{
    
    [Table("survey")]
    public class Survey
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("survey_id")]
        public int SurveyId { get; set; }

        [Required]
        [MaxLength(500)]
        [Column("survey_text")]
        public string SurveyText { get; set; } = string.Empty;

        [Required]
        [Column("survey_type")]
        public SurveyType SurveyType { get; set; }

        [Column("region_target_id")]
        public int? RegionTargetId { get; set; }

        [Required]
        [Column("topic_id")]
        public int TopicId { get; set; }

        [Required]
        [Column("author_id")]
        public Guid AuthorId { get; set; }

        [Required]
        [Column("status")]
        public SurveyStatus Status { get; set; }  = SurveyStatus.Pending;

        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }


        [ForeignKey(nameof(RegionTargetId))]
        public virtual Region? Region { get; set; }

        [ForeignKey(nameof(TopicId))]
        public virtual SurveyTopic? SurveyTopic { get; set; }

        [ForeignKey(nameof(AuthorId))]
        public virtual User? Author { get; set; }

    }
}
