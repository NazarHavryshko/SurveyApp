namespace MySurveyApp.SqlService.Models
{
    public static class Triggers
    {
        public static readonly string CreateTriggersSql = @"
            -- ==========================================
            -- 1. ТРИГЕР: Віднімання токену при створенні опитування
            -- ==========================================
            CREATE OR REPLACE FUNCTION check_and_deduct_survey_token()
            RETURNS TRIGGER AS $$
            DECLARE
                v_user_type VARCHAR(50);
                v_tokens INT;
            BEGIN
                SELECT user_type, available_question_tokens 
                INTO v_user_type, v_tokens
                FROM users 
                WHERE user_id = NEW.author_id;

                IF v_user_type = 'Registered' THEN
                    IF v_tokens <= 0 THEN
                        RAISE EXCEPTION 'Недостатньо токенів для створення опитування.' USING ERRCODE = 'P0001';
                    END IF;

                    UPDATE users
                    SET available_question_tokens = available_question_tokens - 1
                    WHERE user_id = NEW.author_id;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trg_deduct_token_on_survey_create ON survey;
            CREATE TRIGGER trg_deduct_token_on_survey_create
            BEFORE INSERT ON survey
            FOR EACH ROW
            EXECUTE FUNCTION check_and_deduct_survey_token();


            -- ==========================================
            -- 2. ТРИГЕР: Гейміфікація та нарахування токенів за взаємодії
            -- ==========================================
            CREATE OR REPLACE FUNCTION handle_user_interaction_gamification()
            RETURNS TRIGGER AS $$
            DECLARE
                v_current_answers INT;
            BEGIN
                -- Збільшуємо лічильник відповідей та оновлюємо час останньої активності
                UPDATE users
                SET answers_count = answers_count + 1,
                    last_active_at = NOW()
                WHERE user_id = NEW.user_id
                RETURNING answers_count INTO v_current_answers;

                -- Якщо набралося 10 або більше відповідей — нараховуємо токени та залишок переносимо
                IF v_current_answers >= 10 THEN
                    UPDATE users
                    SET available_question_tokens = available_question_tokens + (v_current_answers / 10),
                        answers_count = v_current_answers % 10
                    WHERE user_id = NEW.user_id;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trg_survey_interaction_gamification ON survey_interaction;
            CREATE TRIGGER trg_survey_interaction_gamification
            AFTER INSERT ON survey_interaction
            FOR EACH ROW
            EXECUTE FUNCTION handle_user_interaction_gamification();

            -- Вирівнюємо існуючих користувачів, у яких answers_count >= 10
            UPDATE users
            SET available_question_tokens = available_question_tokens + (answers_count / 10),
                answers_count = answers_count % 10
            WHERE answers_count >= 10;
        ";
    }
}