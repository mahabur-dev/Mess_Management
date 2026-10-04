CREATE TABLE "meal_bulk_commands" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mess_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "idempotency_key" VARCHAR(100) NOT NULL,
  "request_hash" VARCHAR(64) NOT NULL,
  "response" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meal_bulk_commands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meal_bulk_commands_mess_id_user_id_idempotency_key_key"
  ON "meal_bulk_commands"("mess_id", "user_id", "idempotency_key");

CREATE INDEX "meal_bulk_commands_mess_id_created_at_idx"
  ON "meal_bulk_commands"("mess_id", "created_at" DESC);

ALTER TABLE "meal_bulk_commands"
  ADD CONSTRAINT "meal_bulk_commands_mess_id_fkey"
  FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meal_bulk_commands"
  ADD CONSTRAINT "meal_bulk_commands_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
