using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MySurveyApp.SqlService.Migrations
{
    /// <inheritdoc />
    public partial class SeedHobbies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "hobby_name",
                table: "hobby",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.InsertData(
                table: "hobby",
                columns: new[] { "hobby_id", "hobby_name" },
                values: new object[,]
                {
                    { 1, "3D-друк та моделювання" },
                    { 2, "Авіамоделювання" },
                    { 3, "Авіаспостереження (плейнспоттінг)" },
                    { 4, "Автотуризм" },
                    { 5, "Айкідо" },
                    { 6, "Акваріумістика" },
                    { 7, "Акварельний живопис" },
                    { 8, "Акробатика" },
                    { 9, "Алмазна мозаїка" },
                    { 10, "Альпінізм" },
                    { 11, "Анімація та мультиплікація" },
                    { 12, "Апсайклінг (переробка речей)" },
                    { 13, "Археологія" },
                    { 14, "Астрономія та спостереження за зірками" },
                    { 15, "Астрофотографія" },
                    { 16, "Бадмінтон" },
                    { 17, "Бальні танці" },
                    { 18, "Баскетбол" },
                    { 19, "Батик (розпис тканини)" },
                    { 20, "Бачата" },
                    { 21, "Бджільництво" },
                    { 22, "Бейсбол" },
                    { 23, "Бердвотчінг (спостереження за птахами)" },
                    { 24, "Більярд" },
                    { 25, "Біг (марафон, трейл)" },
                    { 26, "Бігові лижі" },
                    { 27, "Бісероплетіння" },
                    { 28, "Блогерство та створення відео" },
                    { 29, "Бонсай (вирощування карликових дерев)" },
                    { 30, "Бокс" },
                    { 31, "Боулдеринг" },
                    { 32, "Боулінг" },
                    { 33, "Бразильське джиу-джитсу" },
                    { 34, "Бушкрафт (навички виживання)" },
                    { 35, "Вейкбординг" },
                    { 36, "Велоспорт" },
                    { 37, "Вередіння та прядіння" },
                    { 38, "Верхова їзда" },
                    { 39, "Виготовлення ароматичних свічок" },
                    { 40, "Виготовлення вітражів" },
                    { 41, "Виготовлення домашнього мила" },
                    { 42, "Виготовлення кераміки" },
                    { 43, "Виготовлення ляльок-мотанок" },
                    { 44, "Виготовлення макетів споруд" },
                    { 45, "Виготовлення ножів" },
                    { 46, "Виготовлення прикрас зі смоли" },
                    { 47, "Виготовлення шкіряних виробів" },
                    { 48, "Виноробство" },
                    { 49, "Випалювання по дереву (пірографія)" },
                    { 50, "Вирощування кімнатних рослин" },
                    { 51, "Вирощування мікрозелені" },
                    { 52, "Вирощування сукулентів та кактусів" },
                    { 53, "Вирощування хижих рослин" },
                    { 54, "Вишивка гладдю" },
                    { 55, "Вишивка стрічками" },
                    { 56, "Вишивка хрестиком" },
                    { 57, "Відеоігри (кіберспорт)" },
                    { 58, "Відеомонтаж" },
                    { 59, "Віндсерфінг" },
                    { 60, "Військово-історична реконструкція" },
                    { 61, "Волонтерство" },
                    { 62, "Волейбол" },
                    { 63, "Воркаут (Street Workout)" },
                    { 64, "В'язання гачком" },
                    { 65, "В'язання спицями" },
                    { 66, "Генеалогія (дослідження родоводу)" },
                    { 67, "Геокешинг (пошук схованок)" },
                    { 68, "Гідропоніка" },
                    { 69, "Гірські лижі" },
                    { 70, "Гончарство" },
                    { 71, "Гра на барабанах" },
                    { 72, "Гра на гітарі" },
                    { 73, "Гра на дудуці" },
                    { 74, "Гра на електрогітарі" },
                    { 75, "Гра на скрипці" },
                    { 76, "Гра на сопілці" },
                    { 77, "Гра на укулеле" },
                    { 78, "Гра на фортепіано" },
                    { 79, "Гравірування" },
                    { 80, "Графічний дизайн" },
                    { 81, "Гребля на байдарках і каное" },
                    { 82, "Дайвінг (підводне плавання)" },
                    { 83, "Дартс" },
                    { 84, "Декупаж" },
                    { 85, "Діджеїнг (DJing)" },
                    { 86, "Домашнє пивоваріння" },
                    { 87, "Домашній хлібопекарський крафт" },
                    { 88, "Дресирування та кінологія" },
                    { 89, "Дрон-рейсинг (пілотування дронів)" },
                    { 90, "Ебру (малювання на воді)" },
                    { 91, "Експериментальна хімія" },
                    { 92, "Електронне конструювання (Arduino, STM32)" },
                    { 93, "Живопис олією" },
                    { 94, "Жонглювання" },
                    { 95, "Збирання грибів" },
                    { 96, "Збирання лікарських трав" },
                    { 97, "Збирання ягід" },
                    { 98, "Звукозапис та саунд-дизайн" },
                    { 99, "Зимове купання (моржування)" },
                    { 100, "Імпровізаційний театр" },
                    { 101, "Кайтсерфінг" },
                    { 102, "Каліграфія та летеринг" },
                    { 103, "Капоейра" },
                    { 104, "Каппінг та дегустація кави" },
                    { 105, "Карате" },
                    { 106, "Картинг" },
                    { 107, "Квілінг (паперокручення)" },
                    { 108, "Кемпінг" },
                    { 109, "Кікбоксинг" },
                    { 110, "Книжковий клуб та читання" },
                    { 111, "Ковальство" },
                    { 112, "Колекціонування вінілових платівок" },
                    { 113, "Колекціонування коміксів" },
                    { 114, "Колекціонування мінералів та кристалів" },
                    { 115, "Колекціонування монет (нумізматика)" },
                    { 116, "Колекціонування поштових марок (філателія)" },
                    { 117, "Кондитерське мистецтво" },
                    { 118, "Косплей" },
                    { 119, "Крафтове виготовлення сиру" },
                    { 120, "Кулінарія народів світу" },
                    { 121, "Купажування чаю" },
                    { 122, "Ландшафтний дизайн" },
                    { 123, "Лозоплетіння" },
                    { 124, "Магічні фокуси та ілюзії" },
                    { 125, "Макіяж та візаж" },
                    { 126, "Макромелінг і макраме" },
                    { 127, "Малювання акрилом" },
                    { 128, "Малювання пастеллю" },
                    { 129, "Медитація та практики усвідомленості" },
                    { 130, "Металопошук (приладовий пошук)" },
                    { 131, "Мікроскопія" },
                    { 132, "Моделювання одягу" },
                    { 133, "Мозаїка" },
                    { 134, "Мотоспорт та ендуро" },
                    { 135, "Написання віршів та прози" },
                    { 136, "Настільний теніс" },
                    { 137, "Настільні рольові ігри (D&D тощо)" },
                    { 138, "Настільні стратегічні ігри" },
                    { 139, "Орігамі" },
                    { 140, "Орієнтування на місцевості" },
                    { 141, "Падел" },
                    { 142, "Паперове моделювання (пепакура)" },
                    { 143, "Парапланеризм" },
                    { 144, "Парусний спорт (яхтинг)" },
                    { 145, "Пейнтбол" },
                    { 146, "Писанкарство" },
                    { 147, "Пілатес" },
                    { 148, "Підводне полювання" },
                    { 149, "Пішохідний туризм (хайкінг, трекінг)" },
                    { 150, "Плавання" },
                    { 151, "Плетіння з бісеру та дроту" },
                    { 152, "Подорожі та бекпекінг" },
                    { 153, "Полімерна глина (ліплення)" },
                    { 154, "Поул-денс" },
                    { 155, "Прес-квілінг і сушіння гербаріїв" },
                    { 156, "Програмування pet-проєктів" },
                    { 157, "Пстругарство та рибальство" },
                    { 158, "Радіоаматорство" },
                    { 159, "Рафтинг" },
                    { 160, "Реставрація старих меблів" },
                    { 161, "Риболовля (спінінг, фідер)" },
                    { 162, "Різьблення по дереву" },
                    { 163, "Різьблення по каменю" },
                    { 164, "Робототехніка" },
                    { 165, "Роликовий спорт" },
                    { 166, "Розпис по склу та порцеляні" },
                    { 167, "Садівництво та городництво" },
                    { 168, "Сальса" },
                    { 169, "Сенсорний капінг чаю" },
                    { 170, "Скейтбординг" },
                    { 171, "Скелелазіння" },
                    { 172, "Скетчинг та міські замальовки" },
                    { 173, "Сквош" },
                    { 174, "Скрапбукінг" },
                    { 175, "Слеклайн (ходіння по стропі)" },
                    { 176, "Сноубординг" },
                    { 177, "Соколине полювання" },
                    { 178, "Спідкубінг (швидкісне збирання кубика Рубіка)" },
                    { 179, "Спелеологія (дослідження печер)" },
                    { 180, "Стендове моделювання техніки" },
                    { 181, "Стендап-комедія" },
                    { 182, "Стрільба з лука" },
                    { 183, "Стрільба кульова" },
                    { 184, "Стрибки з парашутом" },
                    { 185, "Страйкбол (Airsoft)" },
                    { 186, "Судномоделізм" },
                    { 187, "Тату-арт та ескізування" },
                    { 188, "Теніс (великий теніс)" },
                    { 189, "Точіння по дереву" },
                    { 190, "Туризм водний" },
                    { 191, "Фелтінг (валяння шерсті)" },
                    { 192, "Фехтування" },
                    { 193, "Фітнес та тренажерний зал" },
                    { 194, "Флористика" },
                    { 195, "Флораріуми (створення замкнених екосистем)" },
                    { 196, "Фотографія (плівкова та цифрова)" },
                    { 197, "Фрідайвінг" },
                    { 198, "Футзал" },
                    { 199, "Футбол" },
                    { 200, "Шахи та шашки" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 51);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 52);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 53);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 54);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 55);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 56);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 57);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 58);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 59);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 60);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 61);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 62);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 63);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 64);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 65);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 66);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 67);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 68);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 69);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 70);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 71);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 72);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 73);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 74);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 75);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 76);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 77);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 78);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 79);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 80);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 81);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 82);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 83);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 84);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 85);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 86);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 87);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 88);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 89);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 90);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 91);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 92);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 93);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 94);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 95);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 96);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 97);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 98);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 99);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 100);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 101);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 102);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 103);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 104);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 105);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 106);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 107);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 108);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 109);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 110);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 111);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 112);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 113);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 114);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 115);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 116);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 117);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 118);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 119);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 120);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 121);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 122);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 123);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 124);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 125);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 126);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 127);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 128);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 129);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 130);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 131);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 132);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 133);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 134);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 135);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 136);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 137);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 138);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 139);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 140);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 141);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 142);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 143);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 144);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 145);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 146);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 147);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 148);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 149);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 150);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 151);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 152);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 153);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 154);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 155);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 156);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 157);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 158);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 159);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 160);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 161);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 162);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 163);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 164);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 165);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 166);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 167);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 168);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 169);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 170);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 171);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 172);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 173);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 174);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 175);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 176);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 177);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 178);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 179);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 180);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 181);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 182);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 183);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 184);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 185);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 186);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 187);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 188);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 189);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 190);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 191);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 192);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 193);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 194);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 195);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 196);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 197);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 198);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 199);

            migrationBuilder.DeleteData(
                table: "hobby",
                keyColumn: "hobby_id",
                keyValue: 200);

            migrationBuilder.AlterColumn<string>(
                name: "hobby_name",
                table: "hobby",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150);
        }
    }
}
