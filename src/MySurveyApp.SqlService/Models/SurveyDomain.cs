using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySurveyApp.SqlService.Models
{
    
    [Table("survey_domain")]
    [Index(nameof(DomainName), IsUnique = true)]
    public class SurveyDomain
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("domain_id")]
        public int DomainId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("domain_name")]
        public string DomainName { get; set; } = string.Empty;
    }
}
