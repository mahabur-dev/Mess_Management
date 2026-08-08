-- Meal pattern versions and member-level provenance for generated attendance.
CREATE TYPE "MealAttendanceSource" AS ENUM ('MANUAL', 'PATTERN');
CREATE TYPE "MealPatternType" AS ENUM ('DAILY', 'WEEKLY');
CREATE TYPE "MealPatternStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED', 'CANCELLED');

ALTER TABLE "meal_attendances"
  ADD COLUMN "source" "MealAttendanceSource" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "pattern_id" UUID;

CREATE TABLE "meal_patterns" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "series_id" UUID NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "membership_id" UUID NOT NULL,
  "pattern_type" "MealPatternType" NOT NULL,
  "status" "MealPatternStatus" NOT NULL DEFAULT 'DRAFT',
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "daily_schedule" JSONB,
  "weekly_schedule" JSONB,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "meal_patterns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meal_patterns_series_id_version_key" ON "meal_patterns"("series_id", "version");
CREATE UNIQUE INDEX "meal_patterns_one_active_per_membership_key" ON "meal_patterns"("membership_id") WHERE "status" = 'ACTIVE';
CREATE INDEX "meal_patterns_membership_id_status_idx" ON "meal_patterns"("membership_id", "status");
CREATE INDEX "meal_patterns_start_date_end_date_idx" ON "meal_patterns"("start_date", "end_date");
CREATE INDEX "meal_attendances_pattern_id_idx" ON "meal_attendances"("pattern_id");

ALTER TABLE "meal_patterns" ADD CONSTRAINT "meal_patterns_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "mess_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_patterns" ADD CONSTRAINT "meal_patterns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meal_attendances" ADD CONSTRAINT "meal_attendances_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "meal_patterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
