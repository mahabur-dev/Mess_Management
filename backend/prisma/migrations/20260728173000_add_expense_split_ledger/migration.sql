-- Ensure payment source enum exists. Some older migration chains added the Prisma
-- schema enum without a matching SQL migration, so fresh databases may not have it.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExpensePaymentType') THEN
    CREATE TYPE "ExpensePaymentType" AS ENUM ('FROM_DEPOSIT', 'PERSONAL', 'COLLECTED_FUND');
  ELSE
    ALTER TYPE "ExpensePaymentType" ADD VALUE IF NOT EXISTS 'COLLECTED_FUND';
  END IF;
END $$;

-- New expense module enums.
DO $$ BEGIN
  CREATE TYPE "ExpenseRecordType" AS ENUM ('EXPENSE', 'UTILITY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExpenseUsedBy" AS ENUM ('SELF_ONLY', 'SELECTED_MEMBERS', 'ALL_MEMBERS', 'MEAL_ON_MEMBERS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExpenseSplitMethod" AS ENUM ('EQUAL', 'MEAL_COUNT', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "UtilityType" AS ENUM ('ELECTRICITY', 'GAS', 'WATER', 'WIFI', 'CLEANING', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DepositLedgerType" AS ENUM (
    'MEMBER_DEPOSIT',
    'PERSONAL_EXPENSE_CREDIT',
    'MESS_EXPENSE_DEBIT',
    'COLLECTED_FUND_IN',
    'COLLECTED_FUND_OUT',
    'ADJUSTMENT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Backward-compatible columns for the richer Expense & Utility module.
ALTER TABLE "expenses"
  ADD COLUMN IF NOT EXISTS "payment_type" "ExpensePaymentType" NOT NULL DEFAULT 'FROM_DEPOSIT',
  ADD COLUMN IF NOT EXISTS "type" "ExpenseRecordType" NOT NULL DEFAULT 'EXPENSE',
  ADD COLUMN IF NOT EXISTS "utility_type" "UtilityType",
  ADD COLUMN IF NOT EXISTS "billing_month" DATE,
  ADD COLUMN IF NOT EXISTS "used_by" "ExpenseUsedBy" NOT NULL DEFAULT 'ALL_MEMBERS',
  ADD COLUMN IF NOT EXISTS "split_method" "ExpenseSplitMethod" NOT NULL DEFAULT 'MEAL_COUNT',
  ADD COLUMN IF NOT EXISTS "status" "ExpenseStatus" NOT NULL DEFAULT 'CONFIRMED',
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now();

-- Existing utility-like rows get a type/utility hint for better new UI grouping.
UPDATE "expenses"
SET
  "type" = 'UTILITY',
  "utility_type" =
    CASE "category"
      WHEN 'ELECTRICITY' THEN 'ELECTRICITY'::"UtilityType"
      WHEN 'GAS' THEN 'GAS'::"UtilityType"
      WHEN 'WATER' THEN 'WATER'::"UtilityType"
      WHEN 'WIFI' THEN 'WIFI'::"UtilityType"
      WHEN 'CLEANER' THEN 'CLEANING'::"UtilityType"
      ELSE 'OTHER'::"UtilityType"
    END
WHERE "category" IN ('UTILITY', 'ELECTRICITY', 'GAS', 'WIFI', 'CLEANER', 'MAINTENANCE', 'BUABILL', 'WATER');

CREATE TABLE IF NOT EXISTS "expense_shares" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "expense_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "member_name" VARCHAR(100),
  "meal_count" DECIMAL(12, 2),
  "share_amount" DECIMAL(12, 2) NOT NULL,
  "is_payer" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "expense_shares_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "expense_shares_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "expense_shares_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "expense_shares_expense_id_member_id_key" ON "expense_shares"("expense_id", "member_id");
CREATE INDEX IF NOT EXISTS "expense_shares_member_id_idx" ON "expense_shares"("member_id");

CREATE TABLE IF NOT EXISTS "deposit_ledgers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mess_id" UUID NOT NULL,
  "member_id" UUID,
  "expense_id" UUID,
  "type" "DepositLedgerType" NOT NULL,
  "direction" "LedgerDirection" NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "deposit_ledgers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "deposit_ledgers_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "deposit_ledgers_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "deposit_ledgers_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "expenses_mess_id_billing_month_idx" ON "expenses"("mess_id", "billing_month");
CREATE INDEX IF NOT EXISTS "expenses_mess_id_type_status_idx" ON "expenses"("mess_id", "type", "status");
CREATE INDEX IF NOT EXISTS "deposit_ledgers_mess_id_created_at_idx" ON "deposit_ledgers"("mess_id", "created_at");
CREATE INDEX IF NOT EXISTS "deposit_ledgers_mess_id_member_id_idx" ON "deposit_ledgers"("mess_id", "member_id");
CREATE INDEX IF NOT EXISTS "deposit_ledgers_expense_id_idx" ON "deposit_ledgers"("expense_id");
