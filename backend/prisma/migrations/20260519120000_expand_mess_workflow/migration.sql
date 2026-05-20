-- Extend enums for the full mess workflow
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "NoticeType" AS ENUM ('MEAL', 'PAYMENT', 'EMERGENCY', 'MEETING', 'RULE_UPDATE', 'GENERAL');
CREATE TYPE "ComplaintCategory" AS ENUM ('MEAL_CORRECTION', 'PAYMENT_CORRECTION', 'LEAVE_REQUEST', 'ROOM_ISSUE', 'FOOD_ISSUE', 'MAINTENANCE_ISSUE', 'OTHER');
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'PROCESSING', 'SOLVED', 'REJECTED');

ALTER TYPE "MealStatus" ADD VALUE IF NOT EXISTS 'LOCKED';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'FOOD';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'GAS';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'ELECTRICITY';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'WIFI';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'CLEANER';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'MAINTENANCE';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'ROCKET';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_NOTICE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EMERGENCY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MEETING';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RULE_UPDATE';

-- Mess setup fields
ALTER TABLE "messes"
  ADD COLUMN "total_seats" INTEGER,
  ADD COLUMN "monthly_rent" DECIMAL(12,2),
  ADD COLUMN "electricity_bill" DECIMAL(12,2),
  ADD COLUMN "gas_bill" DECIMAL(12,2),
  ADD COLUMN "wifi_bill" DECIMAL(12,2),
  ADD COLUMN "cleaner_bill" DECIMAL(12,2),
  ADD COLUMN "extra_cost" DECIMAL(12,2),
  ADD COLUMN "meal_types" JSONB,
  ADD COLUMN "meal_rate_method" VARCHAR(80) NOT NULL DEFAULT 'EXPENSE_DIVIDED_BY_MEAL_COUNT',
  ADD COLUMN "bazar_rules" TEXT,
  ADD COLUMN "payment_deadline_day" INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN "meal_off_deadline" VARCHAR(5) DEFAULT '22:00',
  ADD COLUMN "settings_completed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "approved_at" TIMESTAMPTZ;

-- Member profile fields
ALTER TABLE "mess_memberships"
  ADD COLUMN "room_no" VARCHAR(30),
  ADD COLUMN "seat_no" VARCHAR(30),
  ADD COLUMN "monthly_rent" DECIMAL(12,2),
  ADD COLUMN "deposit_amount" DECIMAL(12,2),
  ADD COLUMN "due_balance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Meal and expense detail fields
ALTER TABLE "meals" ADD COLUMN "is_locked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "expenses"
  ADD COLUMN "buyer_id" UUID,
  ADD COLUMN "item_name" VARCHAR(150),
  ADD COLUMN "quantity" DECIMAL(10,3),
  ADD COLUMN "unit" VARCHAR(30);

-- Rich monthly bill fields
ALTER TABLE "monthly_bills"
  ADD COLUMN "food_bill" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "seat_rent" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "electricity_bill" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "gas_bill" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "wifi_bill" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "cleaner_bill" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "extra_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "final_due" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "due_date" DATE;

-- Registration requests
CREATE TABLE "mess_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "requester_id" UUID NOT NULL,
  "mess_id" UUID,
  "mess_name" VARCHAR(100) NOT NULL,
  "address" TEXT,
  "total_seats" INTEGER,
  "monthly_rent" DECIMAL(12,2),
  "description" TEXT,
  "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
  "review_note" TEXT,
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "mess_requests_pkey" PRIMARY KEY ("id")
);

-- Payments
CREATE TABLE "payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mess_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "monthly_bill_id" UUID,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "transaction_id" VARCHAR(120),
  "screenshot_url" TEXT,
  "note" TEXT,
  "approved_by" UUID,
  "approved_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Notice board
CREATE TABLE "notices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mess_id" UUID NOT NULL,
  "created_by" UUID NOT NULL,
  "type" "NoticeType" NOT NULL DEFAULT 'GENERAL',
  "title" VARCHAR(200) NOT NULL,
  "body" TEXT NOT NULL,
  "is_pinned" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- Complaints and requests
CREATE TABLE "complaints" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mess_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "category" "ComplaintCategory" NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT NOT NULL,
  "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
  "response" TEXT,
  "updated_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mess_requests_status_created_at_idx" ON "mess_requests"("status", "created_at");
CREATE INDEX "mess_requests_requester_id_idx" ON "mess_requests"("requester_id");
CREATE INDEX "payments_mess_id_member_id_idx" ON "payments"("mess_id", "member_id");
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");
CREATE INDEX "notices_mess_id_created_at_idx" ON "notices"("mess_id", "created_at" DESC);
CREATE INDEX "complaints_mess_id_status_idx" ON "complaints"("mess_id", "status");
CREATE INDEX "complaints_member_id_created_at_idx" ON "complaints"("member_id", "created_at" DESC);

ALTER TABLE "mess_requests" ADD CONSTRAINT "mess_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mess_requests" ADD CONSTRAINT "mess_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mess_requests" ADD CONSTRAINT "mess_requests_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_monthly_bill_id_fkey" FOREIGN KEY ("monthly_bill_id") REFERENCES "monthly_bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notices" ADD CONSTRAINT "notices_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notices" ADD CONSTRAINT "notices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
