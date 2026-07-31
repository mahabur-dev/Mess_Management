-- The Prisma schema added payment_date (DATE) and categories (TEXT[])
-- to the payments model, but these columns were never migrated to the
-- database. Keep the database aligned with the Payment Prisma model.

ALTER TABLE "payments"
ADD COLUMN IF NOT EXISTS "payment_date" DATE;

ALTER TABLE "payments"
ADD COLUMN IF NOT EXISTS "categories" TEXT[] NOT NULL DEFAULT '{}';