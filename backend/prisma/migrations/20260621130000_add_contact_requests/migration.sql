CREATE TYPE "ContactRequestSource" AS ENUM ('CONTACT', 'SUBSCRIPTION', 'UPGRADE');
CREATE TYPE "ContactRequestStatus" AS ENUM ('PENDING', 'CONTACTED', 'RESOLVED');

CREATE TABLE "contact_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "email" VARCHAR(120) NOT NULL,
  "phone" VARCHAR(30),
  "description" TEXT NOT NULL,
  "source" "ContactRequestSource" NOT NULL DEFAULT 'CONTACT',
  "requested_plan" "SubscriptionPlan",
  "status" "ContactRequestStatus" NOT NULL DEFAULT 'PENDING',
  "admin_note" TEXT,
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_requests_status_created_at_idx" ON "contact_requests"("status", "created_at");
CREATE INDEX "contact_requests_email_idx" ON "contact_requests"("email");

ALTER TABLE "contact_requests"
ADD CONSTRAINT "contact_requests_reviewed_by_fkey"
FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
