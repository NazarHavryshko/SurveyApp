using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySurveyApp.SqlService.Models
{

    [Table("occupation")]
    [Index(nameof(OccupationName), IsUnique = true)]
    public class Occupation
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("occupation_id")]
        public int OccupationId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("occupation_name")]
        public string OccupationName { get; set; } = string.Empty;

        [Column("occ_domain_id")]
        public int DomainId { get; set; }


        [ForeignKey(nameof(DomainId))]
        public virtual OccupationDomain? OccupationDomain { get; set; }
    }
}
