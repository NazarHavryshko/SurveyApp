using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySurveyApp.SqlService.Models
{
    [Table("hobby")]
    [Index(nameof(HobbyName), IsUnique = true)]
    public class Hobby
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("hobby_id")]
        public int HobbyId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("hobby_name")]
        public string HobbyName { get; set; } = string.Empty;
    }

}
