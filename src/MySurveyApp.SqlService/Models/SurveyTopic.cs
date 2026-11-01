using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySurveyApp.SqlService.Models
{

    [Table("survey_topic")]
    [Index(nameof(TopicName), IsUnique = true)]
    public class SurveyTopic
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("topic_id")]
        public int TopicId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("topic_name")]
        public string TopicName { get; set; } = string.Empty;

        [Column("domain_id")]
        public int DomainId { get; set; }


        [ForeignKey(nameof(DomainId))]
        public virtual SurveyDomain? SurveyDomain { get; set; }
    }
}
