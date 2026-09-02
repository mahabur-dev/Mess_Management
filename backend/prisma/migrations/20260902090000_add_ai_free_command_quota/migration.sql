ALTER TABLE "users"
ADD COLUMN "ai_free_commands_used" INTEGER NOT NULL DEFAULT 0;

UPDATE "users" AS "user"
SET "ai_free_commands_used" = LEAST(
  10,
  (
    SELECT COUNT(*)::INTEGER
    FROM "ai_commands" AS "command"
    WHERE "command"."user_id" = "user"."id"
  )
);

ALTER TABLE "users"
ADD CONSTRAINT "users_ai_free_commands_used_check"
CHECK ("ai_free_commands_used" >= 0);
