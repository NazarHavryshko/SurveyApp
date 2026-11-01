using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MySurveyApp.SqlService.Models;

namespace MySurveyApp.SqlService.Data.Configurations;

public class OccupationDomainConfiguration : IEntityTypeConfiguration<OccupationDomain>
{
    public void Configure(EntityTypeBuilder<OccupationDomain> builder)
    {
        builder.HasKey(od => od.DomainId);

        builder.Property(od => od.DomainName)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasData(
            new OccupationDomain { DomainId = 1, DomainName = "Інформаційні технології та зв'язок" },
            new OccupationDomain { DomainId = 2, DomainName = "Охорона здоров'я та фармація" },
            new OccupationDomain { DomainId = 3, DomainName = "Освіта, педагогіка та наука" },
            new OccupationDomain { DomainId = 4, DomainName = "Фінанси, бухгалтерія та банківська справа" },
            new OccupationDomain { DomainId = 5, DomainName = "Маркетинг, реклама та PR" },
            new OccupationDomain { DomainId = 6, DomainName = "Виробництво, промисловість та інженерія" },
            new OccupationDomain { DomainId = 7, DomainName = "Будівництво, архітектура та нерухомість" },
            new OccupationDomain { DomainId = 8, DomainName = "Транспорт, логістика та склад" },
            new OccupationDomain { DomainId = 9, DomainName = "Юриспруденція та безпека" },
            new OccupationDomain { DomainId = 10, DomainName = "Сфера обслуговування, торгівля та гостинність" },
            new OccupationDomain { DomainId = 11, DomainName = "Агросектор та екологія" },
            new OccupationDomain { DomainId = 12, DomainName = "Студенти та тимчасово непрацюючі" }
        );
    }
}