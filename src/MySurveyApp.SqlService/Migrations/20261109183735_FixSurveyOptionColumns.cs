using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MySurveyApp.SqlService.Migrations
{
    /// <inheritdoc />
    public partial class FixSurveyOptionColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "order_index ",
                table: "survey_option",
                newName: "order_index");

            migrationBuilder.RenameColumn(
                name: "option_text ",
                table: "survey_option",
                newName: "option_text");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "order_index",
                table: "survey_option",
                newName: "order_index ");

            migrationBuilder.RenameColumn(
                name: "option_text",
                table: "survey_option",
                newName: "option_text ");
        }
    }
}
