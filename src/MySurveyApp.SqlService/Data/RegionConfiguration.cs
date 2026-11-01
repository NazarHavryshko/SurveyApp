using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MySurveyApp.SqlService.Models;

namespace MySurveyApp.SqlService.Data.Configurations;

public class RegionConfiguration : IEntityTypeConfiguration<Region>
{
    public void Configure(EntityTypeBuilder<Region> builder)
    {
        builder.HasKey(r => r.RegionId);

        builder.Property(r => r.RegionName)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasData(
            new Region { RegionId = 1, RegionName = "Автономна Республіка Крим" },
            new Region { RegionId = 2, RegionName = "Вінницька область" },
            new Region { RegionId = 3, RegionName = "Волинська область" },
            new Region { RegionId = 4, RegionName = "Дніпропетровська область" },
            new Region { RegionId = 5, RegionName = "Донецька область" },
            new Region { RegionId = 6, RegionName = "Житомирська область" },
            new Region { RegionId = 7, RegionName = "Закарпатська область" },
            new Region { RegionId = 8, RegionName = "Запорізька область" },
            new Region { RegionId = 9, RegionName = "Івано-Франківська область" },
            new Region { RegionId = 10, RegionName = "Київська область" },
            new Region { RegionId = 11, RegionName = "Кіровоградська область" },
            new Region { RegionId = 12, RegionName = "Луганська область" },
            new Region { RegionId = 13, RegionName = "Львівська область" },
            new Region { RegionId = 14, RegionName = "м. Київ" },
            new Region { RegionId = 15, RegionName = "м. Севастополь" },
            new Region { RegionId = 16, RegionName = "Миколаївська область" },
            new Region { RegionId = 17, RegionName = "Одеська область" },
            new Region { RegionId = 18, RegionName = "Полтавська область" },
            new Region { RegionId = 19, RegionName = "Рівненська область" },
            new Region { RegionId = 20, RegionName = "Сумська область" },
            new Region { RegionId = 21, RegionName = "Тернопільська область" },
            new Region { RegionId = 22, RegionName = "Харківська область" },
            new Region { RegionId = 23, RegionName = "Херсонська область" },
            new Region { RegionId = 24, RegionName = "Хмельницька область" },
            new Region { RegionId = 25, RegionName = "Черкаська область" },
            new Region { RegionId = 26, RegionName = "Чернівецька область" },
            new Region { RegionId = 27, RegionName = "Чернігівська область" }
        );
    }
}