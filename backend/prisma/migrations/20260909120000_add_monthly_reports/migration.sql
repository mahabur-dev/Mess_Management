CREATE TYPE "MonthlyReportStatus" AS ENUM ('DRAFT', 'FINALIZED');
CREATE TYPE "MonthlyReportDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

CREATE TABLE "monthly_report_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mess_id" UUID NOT NULL,
  "auto_generate" BOOLEAN NOT NULL DEFAULT true,
  "email_members" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "monthly_report_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "monthly_reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mess_id" UUID NOT NULL,
  "month" DATE NOT NULL,
  "status" "MonthlyReportStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "source_revision" INTEGER NOT NULL DEFAULT 0,
  "snapshot" JSONB NOT NULL,
  "generated_by" UUID,
  "finalized_by" UUID,
  "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finalized_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "monthly_report_deliveries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "report_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "recipient_email" VARCHAR(255) NOT NULL,
  "locale" VARCHAR(5) NOT NULL DEFAULT 'en',
  "status" "MonthlyReportDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "provider_id" VARCHAR(255),
  "last_error" VARCHAR(1000),
  "sent_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "monthly_report_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "monthly_report_settings_mess_id_key" ON "monthly_report_settings"("mess_id");
CREATE UNIQUE INDEX "monthly_reports_mess_id_month_key" ON "monthly_reports"("mess_id", "month");
CREATE INDEX "monthly_reports_mess_id_status_month_idx" ON "monthly_reports"("mess_id", "status", "month" DESC);
CREATE UNIQUE INDEX "monthly_report_deliveries_report_id_member_id_key" ON "monthly_report_deliveries"("report_id", "member_id");
CREATE INDEX "monthly_report_deliveries_status_next_attempt_at_idx" ON "monthly_report_deliveries"("status", "next_attempt_at");
CREATE INDEX "monthly_report_deliveries_member_id_created_at_idx" ON "monthly_report_deliveries"("member_id", "created_at" DESC);

ALTER TABLE "monthly_report_settings" ADD CONSTRAINT "monthly_report_settings_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_finalized_by_fkey" FOREIGN KEY ("finalized_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "monthly_report_deliveries" ADD CONSTRAINT "monthly_report_deliveries_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "monthly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "monthly_report_deliveries" ADD CONSTRAINT "monthly_report_deliveries_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
