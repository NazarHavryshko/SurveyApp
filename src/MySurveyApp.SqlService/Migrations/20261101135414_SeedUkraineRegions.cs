using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MySurveyApp.SqlService.Migrations
{
    /// <inheritdoc />
    public partial class SeedUkraineRegions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "region",
                columns: new[] { "region_id", "region_name" },
                values: new object[,]
                {
                    { 1, "Автономна Республіка Крим" },
                    { 2, "Вінницька область" },
                    { 3, "Волинська область" },
                    { 4, "Дніпропетровська область" },
                    { 5, "Донецька область" },
                    { 6, "Житомирська область" },
                    { 7, "Закарпатська область" },
                    { 8, "Запорізька область" },
                    { 9, "Івано-Франківська область" },
                    { 10, "Київська область" },
                    { 11, "Кіровоградська область" },
                    { 12, "Луганська область" },
                    { 13, "Львівська область" },
                    { 14, "м. Київ" },
                    { 15, "м. Севастополь" },
                    { 16, "Миколаївська область" },
                    { 17, "Одеська область" },
                    { 18, "Полтавська область" },
                    { 19, "Рівненська область" },
                    { 20, "Сумська область" },
                    { 21, "Тернопільська область" },
                    { 22, "Харківська область" },
                    { 23, "Херсонська область" },
                    { 24, "Хмельницька область" },
                    { 25, "Черкаська область" },
                    { 26, "Чернівецька область" },
                    { 27, "Чернігівська область" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "region",
                keyColumn: "region_id",
                keyValue: 27);
        }
    }
}
