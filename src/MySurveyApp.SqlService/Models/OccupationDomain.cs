using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySurveyApp.SqlService.Models
{

    [Table("occupation_domain")]
    [Index(nameof(DomainName), IsUnique = true)]
    public class OccupationDomain
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("occ_domain_id")]
        public int DomainId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("occ_domain_name")]
        public string DomainName { get; set; } = string.Empty;
    }
}
