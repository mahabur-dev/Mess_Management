-- Keep newest-first expense and deposit lists fast and deterministic.
DROP INDEX IF EXISTS "expenses_mess_id_expense_date_idx";
DROP INDEX IF EXISTS "expenses_mess_id_billing_month_idx";

CREATE INDEX "expenses_mess_id_expense_date_created_at_id_idx"
ON "expenses"("mess_id", "expense_date" DESC, "created_at" DESC, "id" DESC);

CREATE INDEX "expenses_mess_id_billing_month_expense_date_created_at_id_idx"
ON "expenses"("mess_id", "billing_month", "expense_date" DESC, "created_at" DESC, "id" DESC);

CREATE INDEX "expenses_expense_date_created_at_id_idx"
ON "expenses"("expense_date" DESC, "created_at" DESC, "id" DESC);

DROP INDEX IF EXISTS "deposits_mess_id_deposit_date_idx";

CREATE INDEX "deposits_mess_id_deposit_date_created_at_id_idx"
ON "deposits"("mess_id", "deposit_date" DESC, "created_at" DESC, "id" DESC);

CREATE INDEX "deposits_deposit_date_created_at_id_idx"
ON "deposits"("deposit_date" DESC, "created_at" DESC, "id" DESC);
