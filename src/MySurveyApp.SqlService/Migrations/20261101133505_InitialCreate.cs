using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MySurveyApp.SqlService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "hobby",
                columns: table => new
                {
                    hobby_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    hobby_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hobby", x => x.hobby_id);
                });

            migrationBuilder.CreateTable(
                name: "occupation_domain",
                columns: table => new
                {
                    occ_domain_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    occ_domain_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_occupation_domain", x => x.occ_domain_id);
                });

            migrationBuilder.CreateTable(
                name: "region",
                columns: table => new
                {
                    region_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    region_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_region", x => x.region_id);
                });

            migrationBuilder.CreateTable(
                name: "survey_domain",
                columns: table => new
                {
                    domain_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    domain_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_survey_domain", x => x.domain_id);
                });

            migrationBuilder.CreateTable(
                name: "occupation",
                columns: table => new
                {
                    occupation_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    occupation_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    occ_domain_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_occupation", x => x.occupation_id);
                    table.ForeignKey(
                        name: "FK_occupation_occupation_domain_occ_domain_id",
                        column: x => x.occ_domain_id,
                        principalTable: "occupation_domain",
                        principalColumn: "occ_domain_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "survey_topic",
                columns: table => new
                {
                    topic_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    topic_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    domain_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_survey_topic", x => x.topic_id);
                    table.ForeignKey(
                        name: "FK_survey_topic_survey_domain_domain_id",
                        column: x => x.domain_id,
                        principalTable: "survey_domain",
                        principalColumn: "domain_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_type = table.Column<string>(type: "text", nullable: false),
                    nickname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    gender = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    birth_year = table.Column<int>(type: "integer", nullable: true),
                    occupation_id = table.Column<int>(type: "integer", nullable: true),
                    region_id = table.Column<int>(type: "integer", nullable: true),
                    hobby_id = table.Column<int>(type: "integer", nullable: true),
                    answers_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    available_question_tokens = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.user_id);
                    table.CheckConstraint("CK_users_gender", "gender IN ('Ч', 'Ж') OR gender IS NULL");
                    table.ForeignKey(
                        name: "FK_users_hobby_hobby_id",
                        column: x => x.hobby_id,
                        principalTable: "hobby",
                        principalColumn: "hobby_id");
                    table.ForeignKey(
                        name: "FK_users_occupation_occupation_id",
                        column: x => x.occupation_id,
                        principalTable: "occupation",
                        principalColumn: "occupation_id");
                    table.ForeignKey(
                        name: "FK_users_region_region_id",
                        column: x => x.region_id,
                        principalTable: "region",
                        principalColumn: "region_id");
                });

            migrationBuilder.CreateTable(
                name: "survey",
                columns: table => new
                {
                    survey_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    survey_text = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    survey_type = table.Column<string>(type: "text", nullable: false),
                    region_target_id = table.Column<int>(type: "integer", nullable: true),
                    topic_id = table.Column<int>(type: "integer", nullable: false),
                    author_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_survey", x => x.survey_id);
                    table.ForeignKey(
                        name: "FK_survey_region_region_target_id",
                        column: x => x.region_target_id,
                        principalTable: "region",
                        principalColumn: "region_id");
                    table.ForeignKey(
                        name: "FK_survey_survey_topic_topic_id",
                        column: x => x.topic_id,
                        principalTable: "survey_topic",
                        principalColumn: "topic_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_survey_users_author_id",
                        column: x => x.author_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "survey_interaction",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    survey_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_survey_interaction", x => new { x.user_id, x.survey_id });
                    table.ForeignKey(
                        name: "FK_survey_interaction_survey_survey_id",
                        column: x => x.survey_id,
                        principalTable: "survey",
                        principalColumn: "survey_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_survey_interaction_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "survey_option",
                columns: table => new
                {
                    option_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    survey_id = table.Column<int>(type: "integer", nullable: false),
                    option_text = table.Column<string>(name: "option_text ", type: "character varying(255)", maxLength: 255, nullable: false),
                    order_index = table.Column<int>(name: "order_index ", type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_survey_option", x => x.option_id);
                    table.ForeignKey(
                        name: "FK_survey_option_survey_survey_id",
                        column: x => x.survey_id,
                        principalTable: "survey",
                        principalColumn: "survey_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_hobby_hobby_name",
                table: "hobby",
                column: "hobby_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_occupation_occ_domain_id",
                table: "occupation",
                column: "occ_domain_id");

            migrationBuilder.CreateIndex(
                name: "IX_occupation_occupation_name",
                table: "occupation",
                column: "occupation_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_occupation_domain_occ_domain_name",
                table: "occupation_domain",
                column: "occ_domain_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_region_region_name",
                table: "region",
                column: "region_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_survey_active_feed",
                table: "survey",
                columns: new[] { "survey_id", "region_target_id" },
                filter: "status = 'Active'");

            migrationBuilder.CreateIndex(
                name: "idx_survey_author_id",
                table: "survey",
                column: "author_id");

            migrationBuilder.CreateIndex(
                name: "idx_survey_region_target_id",
                table: "survey",
                column: "region_target_id");

            migrationBuilder.CreateIndex(
                name: "IX_survey_topic_id",
                table: "survey",
                column: "topic_id");

            migrationBuilder.CreateIndex(
                name: "IX_survey_domain_domain_name",
                table: "survey_domain",
                column: "domain_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_survey_interaction_survey_id",
                table: "survey_interaction",
                column: "survey_id");

            migrationBuilder.CreateIndex(
                name: "idx_survey_option_survey_id",
                table: "survey_option",
                column: "survey_id");

            migrationBuilder.CreateIndex(
                name: "idx_survey_topic_domain_id",
                table: "survey_topic",
                column: "domain_id");

            migrationBuilder.CreateIndex(
                name: "IX_survey_topic_topic_name",
                table: "survey_topic",
                column: "topic_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_hobby_id",
                table: "users",
                column: "hobby_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_nickname",
                table: "users",
                column: "nickname",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_occupation_id",
                table: "users",
                column: "occupation_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_region_id",
                table: "users",
                column: "region_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "survey_interaction");

            migrationBuilder.DropTable(
                name: "survey_option");

            migrationBuilder.DropTable(
                name: "survey");

            migrationBuilder.DropTable(
                name: "survey_topic");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "survey_domain");

            migrationBuilder.DropTable(
                name: "hobby");

            migrationBuilder.DropTable(
                name: "occupation");

            migrationBuilder.DropTable(
                name: "region");

            migrationBuilder.DropTable(
                name: "occupation_domain");
        }
    }
}
