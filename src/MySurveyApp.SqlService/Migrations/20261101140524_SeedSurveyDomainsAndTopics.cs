using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MySurveyApp.SqlService.Migrations
{
    /// <inheritdoc />
    public partial class SeedSurveyDomainsAndTopics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "topic_name",
                table: "survey_topic",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "domain_name",
                table: "survey_domain",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.InsertData(
                table: "survey_domain",
                columns: new[] { "domain_id", "domain_name" },
                values: new object[,]
                {
                    { 1, "IT та цифрові технології" },
                    { 2, "Освіта і наука" },
                    { 3, "Економіка та особисті фінанси" },
                    { 4, "Здоров'я, спорт та медицина" },
                    { 5, "Суспільство і політика" },
                    { 6, "Культура, мистецтво та розваги" },
                    { 7, "Маркетинг, бізнес і споживання" },
                    { 8, "Екологія та міське середовище" },
                    { 9, "Психологія та міжособистісні стосунки" },
                    { 10, "Кар'єра та ринок праці" }
                });

            migrationBuilder.InsertData(
                table: "survey_topic",
                columns: new[] { "topic_id", "domain_id", "topic_name" },
                values: new object[,]
                {
                    { 1, 1, "Штучний інтелект та автоматизація" },
                    { 2, 1, "Кібербезпека та приватність даних" },
                    { 3, 1, "Мобільні додатки та ОС" },
                    { 4, 1, "Хмарні технології та DevOps" },
                    { 5, 1, "Відеоігри та кіберспорт" },
                    { 6, 2, "Дистанційне та онлайн-навчання" },
                    { 7, 2, "Якість вищої освіти" },
                    { 8, 2, "Вивчення іноземних мов" },
                    { 9, 2, "Наукові дослідження та інновації" },
                    { 10, 2, "Курси підвищення кваліфікації" },
                    { 11, 3, "Особистий бюджет та заощадження" },
                    { 12, 3, "Банківські послуги та фінтех" },
                    { 13, 3, "Криптовалюти та цифрові активи" },
                    { 14, 3, "Інвестиції та цінні папери" },
                    { 15, 3, "Кредитування та іпотека" },
                    { 16, 4, "Здорове харчування та дієти" },
                    { 17, 4, "Фізична активність і фітнес" },
                    { 18, 4, "Якість медичних послуг" },
                    { 19, 4, "Режим сну та біоритми" },
                    { 20, 4, "Профілактика хронічних захворювань" },
                    { 21, 5, "Громадянська активність та волонтерство" },
                    { 22, 5, "Довіра до державних інституцій" },
                    { 23, 5, "Міжнародні відносини та інтеграція" },
                    { 24, 5, "Соціальний захист населення" },
                    { 25, 5, "Медіаграмотність та боротьба з фейками" },
                    { 26, 6, "Кінематограф та стрімінгові сервіси" },
                    { 27, 6, "Сучасна українська література" },
                    { 28, 6, "Музичні фестивалі та концерти" },
                    { 29, 6, "Театр та образотворче мистецтво" },
                    { 30, 6, "Збереження історичної спадщини" },
                    { 31, 7, "Онлайн-шопінг та маркетплейси" },
                    { 32, 7, "Якість клієнтського сервісу" },
                    { 33, 7, "Вплив реклами та інфлюенсерів" },
                    { 34, 7, "Локальні крафтові виробники" },
                    { 35, 7, "Програми лояльності брендів" },
                    { 36, 8, "Сортування та переробка відходів" },
                    { 37, 8, "Громадський транспорт та велоінфраструктура" },
                    { 38, 8, "Відновлювана енергетика та енергоефективність" },
                    { 39, 8, "Озеленення міст та паркові зони" },
                    { 40, 8, "Зміна клімату та забруднення водойм" },
                    { 41, 9, "Боротьба зі стресом та вигоранням" },
                    { 42, 9, "Баланс між роботою та особистим життям" },
                    { 43, 9, "Стосунки в сім'ї та виховання дітей" },
                    { 44, 9, "Знайомства онлайн та соцмережі" },
                    { 45, 9, "Психотерапія та ментальне здоров'я" },
                    { 46, 10, "Віддалена робота проти роботи в офісі" },
                    { 47, 10, "Зміна професії (світчинг)" },
                    { 48, 10, "Рівень заробітних плат та бенефітів" },
                    { 49, 10, "Фриланс та проєктна зайнятість" },
                    { 50, 10, "Співбесіди та адаптація на новому місці" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "survey_topic",
                keyColumn: "topic_id",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "survey_domain",
                keyColumn: "domain_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "survey_domain",
                keyColumn: "domain_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "survey_domain",
                keyColumn: "domain_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "survey_domain",
                keyColumn: "domain_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "survey_domain",
                keyColumn: "domain_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "survey_domain",
                keyColumn: "domain_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "survey_domain",
                keyColumn: "domain_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "survey_domain",
                keyColumn: "domain_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "survey_domain",
                keyColumn: "domain_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "survey_domain",
                keyColumn: "domain_id",
                keyValue: 10);

            migrationBuilder.AlterColumn<string>(
                name: "topic_name",
                table: "survey_topic",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<string>(
                name: "domain_name",
                table: "survey_domain",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150);
        }
    }
}
