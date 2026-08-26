CREATE TYPE "PersonalTransactionType" AS ENUM ('INCOME', 'EXPENSE', 'SAVING');

CREATE TABLE "family_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "relation" VARCHAR(60) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "personal_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "PersonalTransactionType" NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" DATE NOT NULL,
    "description" VARCHAR(500),
    "family_member_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "personal_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "personal_budgets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "month" DATE NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "limit_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "personal_budgets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "family_members_user_id_created_at_idx" ON "family_members"("user_id", "created_at" DESC);
CREATE INDEX "personal_transactions_user_id_date_created_at_idx" ON "personal_transactions"("user_id", "date" DESC, "created_at" DESC);
CREATE INDEX "personal_transactions_user_id_type_date_idx" ON "personal_transactions"("user_id", "type", "date");
CREATE INDEX "personal_transactions_family_member_id_date_idx" ON "personal_transactions"("family_member_id", "date" DESC);
CREATE UNIQUE INDEX "personal_budgets_user_id_month_category_key" ON "personal_budgets"("user_id", "month", "category");
CREATE INDEX "personal_budgets_user_id_month_idx" ON "personal_budgets"("user_id", "month");

ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_transactions" ADD CONSTRAINT "personal_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_transactions" ADD CONSTRAINT "personal_transactions_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "personal_budgets" ADD CONSTRAINT "personal_budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
