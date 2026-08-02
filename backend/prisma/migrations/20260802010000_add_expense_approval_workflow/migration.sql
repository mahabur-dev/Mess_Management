-- ExpenseStatus already models the required lifecycle:
-- DRAFT = pending review, CONFIRMED = approved, CANCELLED = rejected.
-- Keep review metadata separate so existing confirmed expenses remain valid.
ALTER TABLE "expenses"
  ADD COLUMN IF NOT EXISTS "reviewed_by" UUID,
  ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "review_note" VARCHAR(500);
