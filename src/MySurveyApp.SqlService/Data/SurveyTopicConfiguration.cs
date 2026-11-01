using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MySurveyApp.SqlService.Models;

namespace MySurveyApp.SqlService.Data.Configurations;

public class SurveyTopicConfiguration : IEntityTypeConfiguration<SurveyTopic>
{
    public void Configure(EntityTypeBuilder<SurveyTopic> builder)
    {
        builder.HasKey(t => t.TopicId);

        builder.Property(t => t.TopicName)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasData(
            // 1. IT та цифрові технології (DomainId = 1)
            new SurveyTopic { TopicId = 1, TopicName = "Штучний інтелект та автоматизація", DomainId = 1 },
            new SurveyTopic { TopicId = 2, TopicName = "Кібербезпека та приватність даних", DomainId = 1 },
            new SurveyTopic { TopicId = 3, TopicName = "Мобільні додатки та ОС", DomainId = 1 },
            new SurveyTopic { TopicId = 4, TopicName = "Хмарні технології та DevOps", DomainId = 1 },
            new SurveyTopic { TopicId = 5, TopicName = "Відеоігри та кіберспорт", DomainId = 1 },

            // 2. Освіта і наука (DomainId = 2)
            new SurveyTopic { TopicId = 6, TopicName = "Дистанційне та онлайн-навчання", DomainId = 2 },
            new SurveyTopic { TopicId = 7, TopicName = "Якість вищої освіти", DomainId = 2 },
            new SurveyTopic { TopicId = 8, TopicName = "Вивчення іноземних мов", DomainId = 2 },
            new SurveyTopic { TopicId = 9, TopicName = "Наукові дослідження та інновації", DomainId = 2 },
            new SurveyTopic { TopicId = 10, TopicName = "Курси підвищення кваліфікації", DomainId = 2 },

            // 3. Економіка та особисті фінанси (DomainId = 3)
            new SurveyTopic { TopicId = 11, TopicName = "Особистий бюджет та заощадження", DomainId = 3 },
            new SurveyTopic { TopicId = 12, TopicName = "Банківські послуги та фінтех", DomainId = 3 },
            new SurveyTopic { TopicId = 13, TopicName = "Криптовалюти та цифрові активи", DomainId = 3 },
            new SurveyTopic { TopicId = 14, TopicName = "Інвестиції та цінні папери", DomainId = 3 },
            new SurveyTopic { TopicId = 15, TopicName = "Кредитування та іпотека", DomainId = 3 },

            // 4. Здоров'я, спорт та медицина (DomainId = 4)
            new SurveyTopic { TopicId = 16, TopicName = "Здорове харчування та дієти", DomainId = 4 },
            new SurveyTopic { TopicId = 17, TopicName = "Фізична активність і фітнес", DomainId = 4 },
            new SurveyTopic { TopicId = 18, TopicName = "Якість медичних послуг", DomainId = 4 },
            new SurveyTopic { TopicId = 19, TopicName = "Режим сну та біоритми", DomainId = 4 },
            new SurveyTopic { TopicId = 20, TopicName = "Профілактика хронічних захворювань", DomainId = 4 },

            // 5. Суспільство і політика (DomainId = 5)
            new SurveyTopic { TopicId = 21, TopicName = "Громадянська активність та волонтерство", DomainId = 5 },
            new SurveyTopic { TopicId = 22, TopicName = "Довіра до державних інституцій", DomainId = 5 },
            new SurveyTopic { TopicId = 23, TopicName = "Міжнародні відносини та інтеграція", DomainId = 5 },
            new SurveyTopic { TopicId = 24, TopicName = "Соціальний захист населення", DomainId = 5 },
            new SurveyTopic { TopicId = 25, TopicName = "Медіаграмотність та боротьба з фейками", DomainId = 5 },

            // 6. Культура, мистецтво та розваги (DomainId = 6)
            new SurveyTopic { TopicId = 26, TopicName = "Кінематограф та стрімінгові сервіси", DomainId = 6 },
            new SurveyTopic { TopicId = 27, TopicName = "Сучасна українська література", DomainId = 6 },
            new SurveyTopic { TopicId = 28, TopicName = "Музичні фестивалі та концерти", DomainId = 6 },
            new SurveyTopic { TopicId = 29, TopicName = "Театр та образотворче мистецтво", DomainId = 6 },
            new SurveyTopic { TopicId = 30, TopicName = "Збереження історичної спадщини", DomainId = 6 },

            // 7. Маркетинг, бізнес і споживання (DomainId = 7)
            new SurveyTopic { TopicId = 31, TopicName = "Онлайн-шопінг та маркетплейси", DomainId = 7 },
            new SurveyTopic { TopicId = 32, TopicName = "Якість клієнтського сервісу", DomainId = 7 },
            new SurveyTopic { TopicId = 33, TopicName = "Вплив реклами та інфлюенсерів", DomainId = 7 },
            new SurveyTopic { TopicId = 34, TopicName = "Локальні крафтові виробники", DomainId = 7 },
            new SurveyTopic { TopicId = 35, TopicName = "Програми лояльності брендів", DomainId = 7 },

            // 8. Екологія та міське середовище (DomainId = 8)
            new SurveyTopic { TopicId = 36, TopicName = "Сортування та переробка відходів", DomainId = 8 },
            new SurveyTopic { TopicId = 37, TopicName = "Громадський транспорт та велоінфраструктура", DomainId = 8 },
            new SurveyTopic { TopicId = 38, TopicName = "Відновлювана енергетика та енергоефективність", DomainId = 8 },
            new SurveyTopic { TopicId = 39, TopicName = "Озеленення міст та паркові зони", DomainId = 8 },
            new SurveyTopic { TopicId = 40, TopicName = "Зміна клімату та забруднення водойм", DomainId = 8 },

            // 9. Психологія та міжособистісні стосунки (DomainId = 9)
            new SurveyTopic { TopicId = 41, TopicName = "Боротьба зі стресом та вигоранням", DomainId = 9 },
            new SurveyTopic { TopicId = 42, TopicName = "Баланс між роботою та особистим життям", DomainId = 9 },
            new SurveyTopic { TopicId = 43, TopicName = "Стосунки в сім'ї та виховання дітей", DomainId = 9 },
            new SurveyTopic { TopicId = 44, TopicName = "Знайомства онлайн та соцмережі", DomainId = 9 },
            new SurveyTopic { TopicId = 45, TopicName = "Психотерапія та ментальне здоров'я", DomainId = 9 },

            // 10. Кар'єра та ринок праці (DomainId = 10)
            new SurveyTopic { TopicId = 46, TopicName = "Віддалена робота проти роботи в офісі", DomainId = 10 },
            new SurveyTopic { TopicId = 47, TopicName = "Зміна професії (світчинг)", DomainId = 10 },
            new SurveyTopic { TopicId = 48, TopicName = "Рівень заробітних плат та бенефітів", DomainId = 10 },
            new SurveyTopic { TopicId = 49, TopicName = "Фриланс та проєктна зайнятість", DomainId = 10 },
            new SurveyTopic { TopicId = 50, TopicName = "Співбесіди та адаптація на новому місці", DomainId = 10 }
        );
    }
}