-- Preserve the business-effective date for legacy deposit records. Historical
-- rows retain their original creation date so existing monthly totals do not
-- move unexpectedly during deployment.
ALTER TABLE "deposits"
  ADD COLUMN IF NOT EXISTS "deposit_date" DATE;

UPDATE "deposits"
SET "deposit_date" = ("created_at" AT TIME ZONE 'UTC')::date
WHERE "deposit_date" IS NULL;

ALTER TABLE "deposits"
  ALTER COLUMN "deposit_date" SET DEFAULT CURRENT_DATE,
  ALTER COLUMN "deposit_date" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "deposits_mess_id_deposit_date_idx"
  ON "deposits"("mess_id", "deposit_date");

ALTER TABLE "deposit_ledgers"
  ADD COLUMN IF NOT EXISTS "effective_date" DATE;

UPDATE "deposit_ledgers"
SET "effective_date" = ("created_at" AT TIME ZONE 'UTC')::date
WHERE "effective_date" IS NULL;

ALTER TABLE "deposit_ledgers"
  ALTER COLUMN "effective_date" SET DEFAULT CURRENT_DATE,
  ALTER COLUMN "effective_date" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "deposit_ledgers_mess_id_effective_date_idx"
  ON "deposit_ledgers"("mess_id", "effective_date");

ALTER TABLE "expenses"
  ADD COLUMN IF NOT EXISTS "receipt_public_id" TEXT,
  ADD COLUMN IF NOT EXISTS "receipt_resource_type" VARCHAR(20);

ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_receipt_resource_type_check"
  CHECK (
    "receipt_resource_type" IS NULL
    OR "receipt_resource_type" IN ('image', 'raw')
  );

-- Ledger rows created by the legacy SetNull foreign key survive after their
-- expense is deleted and continue to distort balances. Only expense-generated
-- rows are removed; manual collected-fund credits and adjustments remain.
DELETE FROM "deposit_ledgers"
WHERE "expense_id" IS NULL
  AND "type" IN (
    'PERSONAL_EXPENSE_CREDIT',
    'MESS_EXPENSE_DEBIT',
    'COLLECTED_FUND_OUT'
  );

-- An expense ledger entry is part of the expense accounting aggregate, not an
-- independent historical transaction. Deleting the expense must reverse it.
ALTER TABLE "deposit_ledgers"
  DROP CONSTRAINT IF EXISTS "deposit_ledgers_expense_id_fkey";

ALTER TABLE "deposit_ledgers"
  ADD CONSTRAINT "deposit_ledgers_expense_id_fkey"
  FOREIGN KEY ("expense_id") REFERENCES "expenses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Every expense can contribute at most one row of a given ledger type. PostgreSQL
-- permits multiple NULL expense IDs, so manual fund credits are unaffected.
WITH ranked_expense_ledgers AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "expense_id", "type"
      ORDER BY "created_at", "id"
    ) AS row_number
  FROM "deposit_ledgers"
  WHERE "expense_id" IS NOT NULL
)
DELETE FROM "deposit_ledgers"
WHERE "id" IN (
  SELECT "id"
  FROM ranked_expense_ledgers
  WHERE row_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "deposit_ledgers_expense_id_type_key"
  ON "deposit_ledgers"("expense_id", "type");
