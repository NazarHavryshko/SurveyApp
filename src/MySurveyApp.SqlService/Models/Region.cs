using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySurveyApp.SqlService.Models
{
    [Table("region")]
    [Index(nameof(RegionName), IsUnique = true)]
    public class Region
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("region_id")]
        public int RegionId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("region_name")]
        public string RegionName { get; set; } = string.Empty;
    }
}
