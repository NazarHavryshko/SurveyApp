using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MySurveyApp.SqlService.Migrations
{
    public partial class AddSurveyTokenTrigger : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE OR REPLACE FUNCTION check_and_deduct_survey_token()
                RETURNS TRIGGER AS $$
                DECLARE
                    v_user_type INT;
                    v_tokens INT;
                BEGIN
                    SELECT user_type, available_question_tokens 
                    INTO v_user_type, v_tokens
                    FROM users
                    WHERE user_id = NEW.author_id;

                    IF v_user_type = 2 OR v_user_type = 3 THEN
                        RETURN NEW;
                    END IF;

                    IF v_tokens < 1 THEN
                        RAISE EXCEPTION 'Недостатньо токенів (AvailableQuestionTokens) для створення опитування.' 
                        USING ERRCODE = 'P0001';
                    END IF;

                    UPDATE users
                    SET available_question_tokens = available_question_tokens - 1
                    WHERE user_id = NEW.author_id;

                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                -- ТУТ ЗМІНЕНО surveys НА survey:
                CREATE TRIGGER trg_deduct_token_on_survey_create
                BEFORE INSERT ON survey
                FOR EACH ROW
                EXECUTE FUNCTION check_and_deduct_survey_token();
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                -- І ТУТ ЗМІНЕНО surveys НА survey:
                DROP TRIGGER IF EXISTS trg_deduct_token_on_survey_create ON survey;
                DROP FUNCTION IF EXISTS check_and_deduct_survey_token();
            ");
        }
    }
}