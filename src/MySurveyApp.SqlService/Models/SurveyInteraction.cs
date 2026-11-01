using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySurveyApp.SqlService.Models
{
    [Table("survey_interaction")]
    [PrimaryKey(nameof(UserId), nameof(SurveyId))]
    public class SurveyInteraction
    {
        [Column("user_id")]
        public Guid UserId { get; set; } = Guid.NewGuid();

        [Column("survey_id")]
        public int SurveyId { get; set; }


        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        [ForeignKey(nameof(SurveyId))]
        public virtual Survey? Survey { get; set; }
    }
}
