using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySurveyApp.SqlService.Models
{
    [Table("survey_option")]
    public class SurveyOption
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("option_id")]
        public int OptionId { get; set; }

        [Required]
        [Column("survey_id")]
        public int SurveyId { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("option_text ")]
        public string OptionText { get; set; } = string.Empty;

        [Required]
        [Column("order_index ")]
        public int OrderIndex { get; set; }

        [ForeignKey(nameof(SurveyId))]
        public virtual Survey? Survey { get; set; }
    }
}
