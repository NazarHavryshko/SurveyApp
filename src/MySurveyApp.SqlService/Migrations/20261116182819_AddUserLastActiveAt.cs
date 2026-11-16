using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MySurveyApp.SqlService.Migrations
{
    /// <inheritdoc />
    public partial class AddUserLastActiveAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "last_active_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_active_at",
                table: "users");
        }
    }
}
