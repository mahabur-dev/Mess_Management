DO $$
BEGIN
  CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'MONTHLY', 'YEARLY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "subscriptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mess_id" UUID NOT NULL,
  "plan" "SubscriptionPlan" NOT NULL DEFAULT 'TRIAL',
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "start_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "end_date" TIMESTAMPTZ,
  "cancelled_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriptions_mess_id_key" ON "subscriptions"("mess_id");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX "subscriptions_end_date_idx" ON "subscriptions"("end_date");

ALTER TABLE "subscriptions"
ADD CONSTRAINT "subscriptions_mess_id_fkey"
FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
