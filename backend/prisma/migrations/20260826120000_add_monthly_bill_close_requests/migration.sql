CREATE TABLE "monthly_bill_close_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "monthly_bill_id" UUID NOT NULL,
    "mess_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "requested_by" UUID NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "original_balance" DECIMAL(12,2) NOT NULL,
    "original_final_due" DECIMAL(12,2) NOT NULL,
    "original_credit_balance" DECIMAL(12,2) NOT NULL,
    "original_status" "BillStatus" NOT NULL,
    "review_note" TEXT,
    "reviewed_by" UUID,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ,

    CONSTRAINT "monthly_bill_close_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "monthly_bill_close_requests_mess_id_status_requested_at_idx"
ON "monthly_bill_close_requests"("mess_id", "status", "requested_at" DESC);

CREATE INDEX "monthly_bill_close_requests_member_id_requested_at_idx"
ON "monthly_bill_close_requests"("member_id", "requested_at" DESC);

CREATE INDEX "monthly_bill_close_requests_monthly_bill_id_status_idx"
ON "monthly_bill_close_requests"("monthly_bill_id", "status");

CREATE UNIQUE INDEX "monthly_bill_close_requests_one_pending_per_bill_idx"
ON "monthly_bill_close_requests"("monthly_bill_id") WHERE "status" = 'PENDING';

CREATE UNIQUE INDEX "monthly_bill_close_requests_one_approved_per_bill_idx"
ON "monthly_bill_close_requests"("monthly_bill_id") WHERE "status" = 'APPROVED';

ALTER TABLE "monthly_bill_close_requests"
ADD CONSTRAINT "monthly_bill_close_requests_monthly_bill_id_fkey"
FOREIGN KEY ("monthly_bill_id") REFERENCES "monthly_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "monthly_bill_close_requests"
ADD CONSTRAINT "monthly_bill_close_requests_mess_id_fkey"
FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "monthly_bill_close_requests"
ADD CONSTRAINT "monthly_bill_close_requests_member_id_fkey"
FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "monthly_bill_close_requests"
ADD CONSTRAINT "monthly_bill_close_requests_requested_by_fkey"
FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "monthly_bill_close_requests"
ADD CONSTRAINT "monthly_bill_close_requests_reviewed_by_fkey"
FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
