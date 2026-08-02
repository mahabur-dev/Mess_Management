CREATE TYPE "BillingCalculationStatus" AS ENUM ('DIRTY', 'PROCESSING', 'READY', 'FAILED');

ALTER TABLE "monthly_bills"
  ADD COLUMN "credit_balance" DECIMAL(12, 2) NOT NULL DEFAULT 0;

CREATE TABLE "monthly_billing_states" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mess_id" UUID NOT NULL,
  "month" DATE NOT NULL,
  "status" "BillingCalculationStatus" NOT NULL DEFAULT 'DIRTY',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at" TIMESTAMPTZ,
  "calculated_at" TIMESTAMPTZ,
  "next_attempt_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_error" VARCHAR(1000),
  CONSTRAINT "monthly_billing_states_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "monthly_billing_states_mess_id_fkey"
    FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "monthly_billing_states_mess_id_month_key"
  ON "monthly_billing_states"("mess_id", "month");
CREATE INDEX "monthly_billing_states_status_next_attempt_at_requested_at_idx"
  ON "monthly_billing_states"("status", "next_attempt_at", "requested_at");
CREATE INDEX "monthly_billing_states_mess_id_month_idx"
  ON "monthly_billing_states"("mess_id", "month");

-- Multiple API instances may run workers, but only one month per mess can be
-- calculated at a time because balances carry into the following month.
CREATE UNIQUE INDEX "monthly_billing_states_one_processing_per_mess_idx"
  ON "monthly_billing_states"("mess_id")
  WHERE "status" = 'PROCESSING';

CREATE INDEX "payments_mess_id_status_payment_date_idx"
  ON "payments"("mess_id", "status", "payment_date");
CREATE INDEX "payments_mess_id_status_created_at_idx"
  ON "payments"("mess_id", "status", "created_at");
CREATE INDEX "payments_monthly_bill_id_idx"
  ON "payments"("monthly_bill_id");
