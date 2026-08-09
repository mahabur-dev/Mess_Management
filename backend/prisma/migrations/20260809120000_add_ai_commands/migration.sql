CREATE TYPE "AiCommandSourceType" AS ENUM ('TEXT', 'VOICE');
CREATE TYPE "AiCommandIntent" AS ENUM ('EXPENSE_CREATE', 'UTILITY_CREATE', 'DEPOSIT_CREATE', 'MEAL_CREATE', 'UNKNOWN', 'NEEDS_CLARIFICATION');
CREATE TYPE "AiCommandStatus" AS ENUM ('PENDING', 'NEEDS_CLARIFICATION', 'PROCESSING', 'CONFIRMED', 'CANCELLED', 'FAILED');

CREATE TABLE "ai_commands" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mess_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "source_type" "AiCommandSourceType" NOT NULL,
  "intent" "AiCommandIntent" NOT NULL,
  "status" "AiCommandStatus" NOT NULL DEFAULT 'PENDING',
  "locale" VARCHAR(10) NOT NULL DEFAULT 'en',
  "original_input" TEXT,
  "transcript" TEXT,
  "normalized_text" TEXT NOT NULL,
  "provider" VARCHAR(40) NOT NULL,
  "stt_model" VARCHAR(80),
  "command_model" VARCHAR(80) NOT NULL,
  "parsed_payload" JSONB NOT NULL,
  "resolved_payload" JSONB,
  "result_payload" JSONB,
  "missing_fields" JSONB,
  "clarification" TEXT,
  "confidence" DECIMAL(5,4),
  "idempotency_key" VARCHAR(100) NOT NULL,
  "error_code" VARCHAR(80),
  "error_message" TEXT,
  "confirmed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ai_commands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_commands_idempotency_key_key" ON "ai_commands"("idempotency_key");
CREATE INDEX "ai_commands_mess_id_created_at_idx" ON "ai_commands"("mess_id", "created_at");
CREATE INDEX "ai_commands_user_id_status_created_at_idx" ON "ai_commands"("user_id", "status", "created_at");

ALTER TABLE "ai_commands" ADD CONSTRAINT "ai_commands_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_commands" ADD CONSTRAINT "ai_commands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
