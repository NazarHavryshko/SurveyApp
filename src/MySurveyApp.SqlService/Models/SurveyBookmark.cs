using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySurveyApp.SqlService.Models
{
    [Table("survey_bookmarks")]
    [PrimaryKey(nameof(UserId), nameof(SurveyId))]
    public class SurveyBookmark
    {
        [Column("user_id")]
        public Guid UserId { get; set; }

        [Column("survey_id")]
        public int SurveyId { get; set; }


        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        [ForeignKey(nameof(SurveyId))]
        public virtual Survey? Survey { get; set; }
    }
}