ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BAZAR_DUTY';

CREATE TYPE "BazarFrequency" AS ENUM ('EVERY_DAY', 'SPECIFIC_WEEKDAYS', 'CUSTOM_DATES');
CREATE TYPE "BazarScheduleStatus" AS ENUM ('ACTIVE', 'FINISHED');
CREATE TYPE "BazarDateStatus" AS ENUM ('OPEN', 'CLOSED', 'COMPLETED');
CREATE TYPE "BazarDutySlotStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'CLOSED');
CREATE TYPE "BazarRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "bazar_schedule_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mess_id" UUID NOT NULL,
    "frequency" "BazarFrequency" NOT NULL,
    "weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "custom_days" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "default_members_per_date" INTEGER NOT NULL DEFAULT 1,
    "duty_limit" INTEGER NOT NULL DEFAULT 1,
    "include_manager" BOOLEAN NOT NULL DEFAULT false,
    "release_notice_days" INTEGER NOT NULL DEFAULT 5,
    "strict_fairness" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "bazar_schedule_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bazar_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mess_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "BazarScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "frequency" "BazarFrequency" NOT NULL,
    "weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "custom_days" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "default_members_per_date" INTEGER NOT NULL DEFAULT 1,
    "duty_limit" INTEGER NOT NULL,
    "include_manager" BOOLEAN NOT NULL DEFAULT false,
    "release_notice_days" INTEGER NOT NULL DEFAULT 5,
    "strict_fairness" BOOLEAN NOT NULL DEFAULT false,
    "eligible_member_count" INTEGER NOT NULL DEFAULT 0,
    "recommended_duty_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ,
    CONSTRAINT "bazar_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bazar_dates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schedule_id" UUID NOT NULL,
    "duty_date" DATE NOT NULL,
    "required_members" INTEGER NOT NULL,
    "status" "BazarDateStatus" NOT NULL DEFAULT 'OPEN',
    "status_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "bazar_dates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bazar_duty_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bazar_date_id" UUID NOT NULL,
    "slot_number" INTEGER NOT NULL,
    "status" "BazarDutySlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "assigned_member_id" UUID,
    "assigned_by" UUID,
    "assigned_at" TIMESTAMPTZ,
    "last_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "bazar_duty_slots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bazar_swap_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mess_id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "target_member_id" UUID NOT NULL,
    "requester_slot_id" UUID NOT NULL,
    "target_slot_id" UUID NOT NULL,
    "status" "BazarRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "responded_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "bazar_swap_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bazar_release_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mess_id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "slot_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "reviewer_id" UUID,
    "status" "BazarRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "auto_approved" BOOLEAN NOT NULL DEFAULT false,
    "responded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "bazar_release_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bazar_schedule_settings_mess_id_key" ON "bazar_schedule_settings"("mess_id");
CREATE UNIQUE INDEX "bazar_schedules_mess_id_year_month_key" ON "bazar_schedules"("mess_id", "year", "month");
CREATE UNIQUE INDEX "bazar_schedules_mess_id_version_key" ON "bazar_schedules"("mess_id", "version");
CREATE INDEX "bazar_schedules_mess_id_status_idx" ON "bazar_schedules"("mess_id", "status");
CREATE UNIQUE INDEX "bazar_schedules_one_active_per_mess_key" ON "bazar_schedules"("mess_id") WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "bazar_dates_schedule_id_duty_date_key" ON "bazar_dates"("schedule_id", "duty_date");
CREATE INDEX "bazar_dates_duty_date_idx" ON "bazar_dates"("duty_date");
CREATE UNIQUE INDEX "bazar_duty_slots_bazar_date_id_slot_number_key" ON "bazar_duty_slots"("bazar_date_id", "slot_number");
CREATE UNIQUE INDEX "bazar_duty_slots_bazar_date_id_assigned_member_id_key" ON "bazar_duty_slots"("bazar_date_id", "assigned_member_id");
CREATE INDEX "bazar_duty_slots_assigned_member_id_status_idx" ON "bazar_duty_slots"("assigned_member_id", "status");
CREATE INDEX "bazar_swap_requests_requester_id_status_created_at_idx" ON "bazar_swap_requests"("requester_id", "status", "created_at" DESC);
CREATE INDEX "bazar_swap_requests_target_member_id_status_created_at_idx" ON "bazar_swap_requests"("target_member_id", "status", "created_at" DESC);
CREATE INDEX "bazar_swap_requests_mess_id_status_idx" ON "bazar_swap_requests"("mess_id", "status");
CREATE INDEX "bazar_release_requests_mess_id_status_created_at_idx" ON "bazar_release_requests"("mess_id", "status", "created_at" DESC);
CREATE INDEX "bazar_release_requests_requester_id_created_at_idx" ON "bazar_release_requests"("requester_id", "created_at" DESC);
CREATE UNIQUE INDEX "bazar_release_requests_one_pending_per_slot_key" ON "bazar_release_requests"("slot_id") WHERE "status" = 'PENDING';

ALTER TABLE "bazar_schedule_settings" ADD CONSTRAINT "bazar_schedule_settings_values_check" CHECK (
    "default_members_per_date" > 0 AND "duty_limit" > 0 AND "release_notice_days" >= 0
);
ALTER TABLE "bazar_schedules" ADD CONSTRAINT "bazar_schedules_values_check" CHECK (
    "year" BETWEEN 2020 AND 2200 AND "month" BETWEEN 1 AND 12 AND "version" > 0 AND
    "default_members_per_date" > 0 AND "duty_limit" > 0 AND "release_notice_days" >= 0 AND
    "eligible_member_count" >= 0 AND "recommended_duty_count" >= 0
);
ALTER TABLE "bazar_dates" ADD CONSTRAINT "bazar_dates_required_members_check" CHECK ("required_members" > 0);
ALTER TABLE "bazar_duty_slots" ADD CONSTRAINT "bazar_duty_slots_number_check" CHECK ("slot_number" > 0);

ALTER TABLE "bazar_schedule_settings" ADD CONSTRAINT "bazar_schedule_settings_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bazar_schedule_settings" ADD CONSTRAINT "bazar_schedule_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bazar_schedules" ADD CONSTRAINT "bazar_schedules_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bazar_schedules" ADD CONSTRAINT "bazar_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bazar_dates" ADD CONSTRAINT "bazar_dates_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "bazar_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bazar_duty_slots" ADD CONSTRAINT "bazar_duty_slots_bazar_date_id_fkey" FOREIGN KEY ("bazar_date_id") REFERENCES "bazar_dates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bazar_duty_slots" ADD CONSTRAINT "bazar_duty_slots_assigned_member_id_fkey" FOREIGN KEY ("assigned_member_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bazar_duty_slots" ADD CONSTRAINT "bazar_duty_slots_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bazar_swap_requests" ADD CONSTRAINT "bazar_swap_requests_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bazar_swap_requests" ADD CONSTRAINT "bazar_swap_requests_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "bazar_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bazar_swap_requests" ADD CONSTRAINT "bazar_swap_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bazar_swap_requests" ADD CONSTRAINT "bazar_swap_requests_target_member_id_fkey" FOREIGN KEY ("target_member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bazar_swap_requests" ADD CONSTRAINT "bazar_swap_requests_requester_slot_id_fkey" FOREIGN KEY ("requester_slot_id") REFERENCES "bazar_duty_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bazar_swap_requests" ADD CONSTRAINT "bazar_swap_requests_target_slot_id_fkey" FOREIGN KEY ("target_slot_id") REFERENCES "bazar_duty_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bazar_release_requests" ADD CONSTRAINT "bazar_release_requests_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bazar_release_requests" ADD CONSTRAINT "bazar_release_requests_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "bazar_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bazar_release_requests" ADD CONSTRAINT "bazar_release_requests_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "bazar_duty_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bazar_release_requests" ADD CONSTRAINT "bazar_release_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bazar_release_requests" ADD CONSTRAINT "bazar_release_requests_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
