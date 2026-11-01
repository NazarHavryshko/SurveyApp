using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MySurveyApp.SqlService.Migrations
{
    /// <inheritdoc />
    public partial class SeedOccupations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "occ_domain_name",
                table: "occupation_domain",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "occupation_name",
                table: "occupation",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.InsertData(
                table: "occupation_domain",
                columns: new[] { "occ_domain_id", "occ_domain_name" },
                values: new object[,]
                {
                    { 1, "Інформаційні технології та зв'язок" },
                    { 2, "Охорона здоров'я та фармація" },
                    { 3, "Освіта, педагогіка та наука" },
                    { 4, "Фінанси, бухгалтерія та банківська справа" },
                    { 5, "Маркетинг, реклама та PR" },
                    { 6, "Виробництво, промисловість та інженерія" },
                    { 7, "Будівництво, архітектура та нерухомість" },
                    { 8, "Транспорт, логістика та склад" },
                    { 9, "Юриспруденція та безпека" },
                    { 10, "Сфера обслуговування, торгівля та гостинність" },
                    { 11, "Агросектор та екологія" },
                    { 12, "Студенти та тимчасово непрацюючі" }
                });

            migrationBuilder.InsertData(
                table: "occupation",
                columns: new[] { "occupation_id", "occ_domain_id", "occupation_name" },
                values: new object[,]
                {
                    { 1, 1, "Backend Developer (.NET / Java / Go / Python)" },
                    { 2, 1, "Frontend Developer (React / Angular / Vue)" },
                    { 3, 1, "Mobile App Developer (Flutter / iOS / Android)" },
                    { 4, 1, "DevOps / SRE Engineer" },
                    { 5, 1, "QA Engineer (Manual / Automation)" },
                    { 6, 1, "UI/UX Designer" },
                    { 7, 1, "Data Analyst / BI Specialist" },
                    { 8, 1, "Data Scientist / Machine Learning Engineer" },
                    { 9, 1, "Project Manager / Scrum Master" },
                    { 10, 1, "Системний адміністратор / мережевий інженер" },
                    { 11, 2, "Лікар загальної практики / сімейний лікар" },
                    { 12, 2, "Лікар-хірург" },
                    { 13, 2, "Лікар-стоматолог" },
                    { 14, 2, "Медична сестра / фельдшер" },
                    { 15, 2, "Провізор / фармацевт" },
                    { 16, 2, "Психотерапевт / клінічний психолог" },
                    { 17, 2, "Реабілітолог / фізіотерапевт" },
                    { 18, 3, "Викладач закладу вищої освіти" },
                    { 19, 3, "Вчитель середньої школи" },
                    { 20, 3, "Вихователь дошкільного закладу" },
                    { 21, 3, "Науковий співробітник / дослідник" },
                    { 22, 3, "Репетитор / приватний тьютор" },
                    { 23, 4, "Бухгалтер / головний бухгалтер" },
                    { 24, 4, "Фінансовий аналітик / аудитор" },
                    { 25, 4, "Спеціаліст банківського відділення" },
                    { 26, 4, "Кредитний інспектор" },
                    { 27, 4, "Економіст з планування" },
                    { 28, 5, "Інтернет-маркетолог / Digital Marketing Manager" },
                    { 29, 5, "SMM-спеціаліст / контент-мейкер" },
                    { 30, 5, "SEO / PPC спеціаліст (Targetologist)" },
                    { 31, 5, "Копірайтер / сценарист" },
                    { 32, 5, "PR-менеджер / прессекретар" },
                    { 33, 6, "Інженер-конструктор / технолог" },
                    { 34, 3, "Інженер-електрик / енергетик" },
                    { 35, 6, "Оператор верстатів з ЧПК" },
                    { 36, 6, "Слюсар / механік виробничого обладнання" },
                    { 37, 6, "Зварювальник / монтажник металоконструкцій" },
                    { 38, 7, "Архітектор / проєктувальник" },
                    { 39, 7, "Виконроб / майстер будівельних робіт" },
                    { 40, 7, "Дизайнер інтер'єру" },
                    { 41, 7, "Рієлтор / менеджер з нерухомості" },
                    { 42, 7, "Опоряджувальник / будівельник-універсал" },
                    { 43, 8, "Менеджер з міжнародної / внутрішньої логістики" },
                    { 44, 8, "Водій вантажного транспорту (далекобійник)" },
                    { 45, 8, "Водій пасажирського транспорту / таксі" },
                    { 46, 8, "Кур'єр / експедитор" },
                    { 47, 8, "Завідувач складу / комірник" },
                    { 48, 9, "Адвокат / юрист" },
                    { 49, 9, "Нотаріус / помічник нотаріуса" },
                    { 50, 9, "Юрисконсульт підприємства" },
                    { 51, 9, "Працівник правоохоронних органів" },
                    { 52, 9, "Охоронець / інкасатор" },
                    { 53, 10, "Менеджер з продажу / Account Manager" },
                    { 54, 10, "Продавець-консультант / касир" },
                    { 55, 10, "Шеф-кухар / кухар" },
                    { 56, 10, "Офіціант / бармен / бариста" },
                    { 57, 10, "Перукар / колорист / барбер" },
                    { 58, 10, "Майстер нігтьового сервісу / косметолог" },
                    { 59, 11, "Агроном / ґрунтознавець" },
                    { 60, 11, "Ветеринарний лікар" },
                    { 61, 11, "Інженер сільськогосподарської техніки" },
                    { 62, 11, "Еколог / інспектор з охорони навколишнього середовища" },
                    { 63, 12, "Студент денної / заочної форми" },
                    { 64, 12, "Учень старших класів" },
                    { 65, 12, "Військовослужбовець" },
                    { 66, 12, "ФОП / підприємець" },
                    { 67, 12, "Тимчасово безробітний / у пошуку роботи" },
                    { 68, 12, "Пенсіонер" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 51);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 52);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 53);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 54);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 55);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 56);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 57);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 58);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 59);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 60);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 61);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 62);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 63);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 64);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 65);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 66);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 67);

            migrationBuilder.DeleteData(
                table: "occupation",
                keyColumn: "occupation_id",
                keyValue: 68);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "occupation_domain",
                keyColumn: "occ_domain_id",
                keyValue: 12);

            migrationBuilder.AlterColumn<string>(
                name: "occ_domain_name",
                table: "occupation_domain",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<string>(
                name: "occupation_name",
                table: "occupation",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150);
        }
    }
}
