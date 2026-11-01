using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MySurveyApp.SqlService.Models;

namespace MySurveyApp.SqlService.Data.Configurations;

public class SurveyDomainConfiguration : IEntityTypeConfiguration<SurveyDomain>
{
    public void Configure(EntityTypeBuilder<SurveyDomain> builder)
    {
        builder.HasKey(d => d.DomainId);

        builder.Property(d => d.DomainName)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasData(
            new SurveyDomain { DomainId = 1, DomainName = "IT та цифрові технології" },
            new SurveyDomain { DomainId = 2, DomainName = "Освіта і наука" },
            new SurveyDomain { DomainId = 3, DomainName = "Економіка та особисті фінанси" },
            new SurveyDomain { DomainId = 4, DomainName = "Здоров'я, спорт та медицина" },
            new SurveyDomain { DomainId = 5, DomainName = "Суспільство і політика" },
            new SurveyDomain { DomainId = 6, DomainName = "Культура, мистецтво та розваги" },
            new SurveyDomain { DomainId = 7, DomainName = "Маркетинг, бізнес і споживання" },
            new SurveyDomain { DomainId = 8, DomainName = "Екологія та міське середовище" },
            new SurveyDomain { DomainId = 9, DomainName = "Психологія та міжособистісні стосунки" },
            new SurveyDomain { DomainId = 10, DomainName = "Кар'єра та ринок праці" }
        );
    }
}