-- Add mess category and room setup payloads
ALTER TABLE "messes" ADD COLUMN IF NOT EXISTS "mess_category" VARCHAR(50);
ALTER TABLE "messes" ADD COLUMN IF NOT EXISTS "rooms" JSONB;

ALTER TABLE "mess_requests" ADD COLUMN IF NOT EXISTS "mess_category" VARCHAR(50);
ALTER TABLE "mess_requests" ADD COLUMN IF NOT EXISTS "rooms" JSONB;
