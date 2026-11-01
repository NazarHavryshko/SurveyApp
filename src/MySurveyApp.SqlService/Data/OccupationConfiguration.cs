using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MySurveyApp.SqlService.Models;

namespace MySurveyApp.SqlService.Data.Configurations;

public class OccupationConfiguration : IEntityTypeConfiguration<Occupation>
{
    public void Configure(EntityTypeBuilder<Occupation> builder)
    {
        builder.HasKey(o => o.OccupationId);

        builder.Property(o => o.OccupationName)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasData(
            // 1. Інформаційні технології та зв'язок (OccDomainId = 1)
            new Occupation { OccupationId = 1, OccupationName = "Backend Developer (.NET / Java / Go / Python)", DomainId = 1 },
            new Occupation { OccupationId = 2, OccupationName = "Frontend Developer (React / Angular / Vue)", DomainId = 1 },
            new Occupation { OccupationId = 3, OccupationName = "Mobile App Developer (Flutter / iOS / Android)", DomainId = 1 },
            new Occupation { OccupationId = 4, OccupationName = "DevOps / SRE Engineer", DomainId = 1 },
            new Occupation { OccupationId = 5, OccupationName = "QA Engineer (Manual / Automation)", DomainId = 1 },
            new Occupation { OccupationId = 6, OccupationName = "UI/UX Designer", DomainId = 1 },
            new Occupation { OccupationId = 7, OccupationName = "Data Analyst / BI Specialist", DomainId = 1 },
            new Occupation { OccupationId = 8, OccupationName = "Data Scientist / Machine Learning Engineer", DomainId = 1 },
            new Occupation { OccupationId = 9, OccupationName = "Project Manager / Scrum Master", DomainId = 1 },
            new Occupation { OccupationId = 10, OccupationName = "Системний адміністратор / мережевий інженер", DomainId = 1 },

            // 2. Охорона здоров'я та фармація (OccDomainId = 2)
            new Occupation { OccupationId = 11, OccupationName = "Лікар загальної практики / сімейний лікар", DomainId = 2 },
            new Occupation { OccupationId = 12, OccupationName = "Лікар-хірург", DomainId = 2 },
            new Occupation { OccupationId = 13, OccupationName = "Лікар-стоматолог", DomainId = 2 },
            new Occupation { OccupationId = 14, OccupationName = "Медична сестра / фельдшер", DomainId = 2 },
            new Occupation { OccupationId = 15, OccupationName = "Провізор / фармацевт", DomainId = 2 },
            new Occupation { OccupationId = 16, OccupationName = "Психотерапевт / клінічний психолог", DomainId = 2 },
            new Occupation { OccupationId = 17, OccupationName = "Реабілітолог / фізіотерапевт", DomainId = 2 },

            // 3. Освіта, педагогіка та наука (OccDomainId = 3)
            new Occupation { OccupationId = 18, OccupationName = "Викладач закладу вищої освіти", DomainId = 3 },
            new Occupation { OccupationId = 19, OccupationName = "Вчитель середньої школи", DomainId = 3 },
            new Occupation { OccupationId = 20, OccupationName = "Вихователь дошкільного закладу", DomainId = 3 },
            new Occupation { OccupationId = 21, OccupationName = "Науковий співробітник / дослідник", DomainId = 3 },
            new Occupation { OccupationId = 22, OccupationName = "Репетитор / приватний тьютор", DomainId = 3 },

            // 4. Фінанси, бухгалтерія та банківська справа (OccDomainId = 4)
            new Occupation { OccupationId = 23, OccupationName = "Бухгалтер / головний бухгалтер", DomainId = 4 },
            new Occupation { OccupationId = 24, OccupationName = "Фінансовий аналітик / аудитор", DomainId = 4 },
            new Occupation { OccupationId = 25, OccupationName = "Спеціаліст банківського відділення", DomainId = 4 },
            new Occupation { OccupationId = 26, OccupationName = "Кредитний інспектор", DomainId = 4 },
            new Occupation { OccupationId = 27, OccupationName = "Економіст з планування", DomainId = 4 },

            // 5. Маркетинг, реклама та PR (OccDomainId = 5)
            new Occupation { OccupationId = 28, OccupationName = "Інтернет-маркетолог / Digital Marketing Manager", DomainId = 5 },
            new Occupation { OccupationId = 29, OccupationName = "SMM-спеціаліст / контент-мейкер", DomainId = 5 },
            new Occupation { OccupationId = 30, OccupationName = "SEO / PPC спеціаліст (Targetologist)", DomainId = 5 },
            new Occupation { OccupationId = 31, OccupationName = "Копірайтер / сценарист", DomainId = 5 },
            new Occupation { OccupationId = 32, OccupationName = "PR-менеджер / прессекретар", DomainId = 5 },

            // 6. Виробництво, промисловість та інженерія (OccDomainId = 6)
            new Occupation { OccupationId = 33, OccupationName = "Інженер-конструктор / технолог", DomainId = 6 },
            new Occupation { OccupationId = 34, OccupationName = "Інженер-електрик / енергетик", DomainId = 3 },
            new Occupation { OccupationId = 35, OccupationName = "Оператор верстатів з ЧПК", DomainId = 6 },
            new Occupation { OccupationId = 36, OccupationName = "Слюсар / механік виробничого обладнання", DomainId = 6 },
            new Occupation { OccupationId = 37, OccupationName = "Зварювальник / монтажник металоконструкцій", DomainId = 6 },

            // 7. Будівництво, архітектура та нерухомість (DomainId = 7)
            new Occupation { OccupationId = 38, OccupationName = "Архітектор / проєктувальник", DomainId = 7 },
            new Occupation { OccupationId = 39, OccupationName = "Виконроб / майстер будівельних робіт", DomainId = 7 },
            new Occupation { OccupationId = 40, OccupationName = "Дизайнер інтер'єру", DomainId = 7 },
            new Occupation { OccupationId = 41, OccupationName = "Рієлтор / менеджер з нерухомості", DomainId = 7 },
            new Occupation { OccupationId = 42, OccupationName = "Опоряджувальник / будівельник-універсал", DomainId = 7 },

            // 8. Транспорт, логістика та склад (DomainId = 8)
            new Occupation { OccupationId = 43, OccupationName = "Менеджер з міжнародної / внутрішньої логістики", DomainId = 8 },
            new Occupation { OccupationId = 44, OccupationName = "Водій вантажного транспорту (далекобійник)", DomainId = 8 },
            new Occupation { OccupationId = 45, OccupationName = "Водій пасажирського транспорту / таксі", DomainId = 8 },
            new Occupation { OccupationId = 46, OccupationName = "Кур'єр / експедитор", DomainId = 8 },
            new Occupation { OccupationId = 47, OccupationName = "Завідувач складу / комірник", DomainId = 8 },

            // 9. Юриспруденція та безпека (DomainId = 9)
            new Occupation { OccupationId = 48, OccupationName = "Адвокат / юрист", DomainId = 9 },
            new Occupation { OccupationId = 49, OccupationName = "Нотаріус / помічник нотаріуса", DomainId = 9 },
            new Occupation { OccupationId = 50, OccupationName = "Юрисконсульт підприємства", DomainId = 9 },
            new Occupation { OccupationId = 51, OccupationName = "Працівник правоохоронних органів", DomainId = 9 },
            new Occupation { OccupationId = 52, OccupationName = "Охоронець / інкасатор", DomainId = 9 },

            // 10. Сфера обслуговування, торгівля та гостинність (DomainId = 10)
            new Occupation { OccupationId = 53, OccupationName = "Менеджер з продажу / Account Manager", DomainId = 10 },
            new Occupation { OccupationId = 54, OccupationName = "Продавець-консультант / касир", DomainId = 10 },
            new Occupation { OccupationId = 55, OccupationName = "Шеф-кухар / кухар", DomainId = 10 },
            new Occupation { OccupationId = 56, OccupationName = "Офіціант / бармен / бариста", DomainId = 10 },
            new Occupation { OccupationId = 57, OccupationName = "Перукар / колорист / барбер", DomainId = 10 },
            new Occupation { OccupationId = 58, OccupationName = "Майстер нігтьового сервісу / косметолог", DomainId = 10 },

            // 11. Агросектор та екологія (DomainId = 11)
            new Occupation { OccupationId = 59, OccupationName = "Агроном / ґрунтознавець", DomainId = 11 },
            new Occupation { OccupationId = 60, OccupationName = "Ветеринарний лікар", DomainId = 11 },
            new Occupation { OccupationId = 61, OccupationName = "Інженер сільськогосподарської техніки", DomainId = 11 },
            new Occupation { OccupationId = 62, OccupationName = "Еколог / інспектор з охорони навколишнього середовища", DomainId = 11 },

            // 12. Студенти та інші статуси (DomainId = 12)
            new Occupation { OccupationId = 63, OccupationName = "Студент денної / заочної форми", DomainId = 12 },
            new Occupation { OccupationId = 64, OccupationName = "Учень старших класів", DomainId = 12 },
            new Occupation { OccupationId = 65, OccupationName = "Військовослужбовець", DomainId = 12 },
            new Occupation { OccupationId = 66, OccupationName = "ФОП / підприємець", DomainId = 12 },
            new Occupation { OccupationId = 67, OccupationName = "Тимчасово безробітний / у пошуку роботи", DomainId = 12 },
            new Occupation { OccupationId = 68, OccupationName = "Пенсіонер", DomainId = 12 }
        );
    }
}