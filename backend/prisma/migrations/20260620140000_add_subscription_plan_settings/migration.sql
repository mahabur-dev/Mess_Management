DO $$
BEGIN
  CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'MONTHLY', 'YEARLY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "subscription_plan_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "plan" "SubscriptionPlan" NOT NULL,
  "label" VARCHAR(100) NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "days" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'BDT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "subscription_plan_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_plan_settings_plan_key" ON "subscription_plan_settings"("plan");

INSERT INTO "subscription_plan_settings" ("plan", "label", "price", "days", "description", "currency", "updated_at")
VALUES
  ('TRIAL', '7 Days Free', 0, 7, 'Trial access for newly approved messes.', 'BDT', CURRENT_TIMESTAMP),
  ('MONTHLY', '1 Month', 499, 30, 'Standard monthly subscription for active messes.', 'BDT', CURRENT_TIMESTAMP),
  ('YEARLY', '1 Year', 4999, 365, 'Best value annual subscription with longer coverage.', 'BDT', CURRENT_TIMESTAMP)
ON CONFLICT ("plan") DO NOTHING;
