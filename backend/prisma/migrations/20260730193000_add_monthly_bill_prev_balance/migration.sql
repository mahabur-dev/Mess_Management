-- Keep the database aligned with the MonthlyBill Prisma model. Existing bills
-- have no carried balance, so zero is the safe backfill and default.
ALTER TABLE "monthly_bills"
ADD COLUMN IF NOT EXISTS "prev_balance" DECIMAL(12, 2) NOT NULL DEFAULT 0;
