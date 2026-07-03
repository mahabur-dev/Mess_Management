ALTER TABLE "expenses"
ADD COLUMN "purchased_by" UUID;

UPDATE "expenses"
SET "purchased_by" = "created_by"
WHERE "purchased_by" IS NULL;

ALTER TABLE "expenses"
ALTER COLUMN "purchased_by" SET NOT NULL;

ALTER TABLE "expenses"
ADD CONSTRAINT "expenses_purchased_by_fkey"
FOREIGN KEY ("purchased_by") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "expenses_purchased_by_idx" ON "expenses"("purchased_by");

ALTER TABLE "payments"
ADD COLUMN "created_by" UUID;

UPDATE "payments"
SET "created_by" = "member_id"
WHERE "created_by" IS NULL;

ALTER TABLE "payments"
ALTER COLUMN "created_by" SET NOT NULL;

ALTER TABLE "payments"
ADD CONSTRAINT "payments_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "payments_created_by_idx" ON "payments"("created_by");
