-- Keep existing accounts usable while reducing the platform to three roles.
UPDATE "users"
SET "role" = 'MANAGER'::"GlobalRole"
WHERE "role" = 'ORGANIZER'::"GlobalRole";

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "GlobalRole" RENAME TO "GlobalRole_legacy";
CREATE TYPE "GlobalRole" AS ENUM ('ADMIN', 'MANAGER', 'MEMBER');
ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "GlobalRole"
  USING ("role"::text::"GlobalRole");
ALTER TABLE "users"
  ALTER COLUMN "role" SET DEFAULT 'MEMBER'::"GlobalRole";
DROP TYPE "GlobalRole_legacy";

-- A member decides tomorrow's meals during the configured window today.
ALTER TABLE "messes"
  ALTER COLUMN "meal_off_deadline" SET DEFAULT '17:00',
  ALTER COLUMN "meal_deadline_start" SET DEFAULT '09:00',
  ALTER COLUMN "meal_deadline_end" SET DEFAULT '17:00',
  ADD COLUMN "meal_default_status" "AttendanceStatus" NOT NULL DEFAULT 'ON',
  ADD COLUMN "meal_allow_no_meal" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "meal_window_notification_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "meal_deadline_notification_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "meal_deadline_reminder_minutes" INTEGER NOT NULL DEFAULT 60;

-- Existing 22:00 -> 11:00 values represented the old overnight semantics.
-- Only migrate that untouched default pair; preserve manager-customized windows.
UPDATE "messes"
SET
  "meal_off_deadline" = '17:00',
  "meal_deadline_start" = '09:00',
  "meal_deadline_end" = '17:00'
WHERE "meal_deadline_start" = '22:00'
  AND "meal_deadline_end" = '11:00';

ALTER TABLE "meals"
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "meal_attendances"
  ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Merge legacy duplicate daily meal aggregates before enforcing uniqueness.
WITH ranked_attendances AS (
  SELECT
    ma."id",
    ROW_NUMBER() OVER (
      PARTITION BY m."mess_id", m."name", m."scheduled_date", ma."member_id"
      ORDER BY ma."updated_at" DESC, ma."id" DESC
    ) AS attendance_rank
  FROM "meal_attendances" ma
  JOIN "meals" m ON m."id" = ma."meal_id"
)
DELETE FROM "meal_attendances" ma
USING ranked_attendances ranked
WHERE ma."id" = ranked."id"
  AND ranked.attendance_rank > 1;

WITH meal_groups AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "mess_id", "name", "scheduled_date"
      ORDER BY "created_at", "id"
    ) AS canonical_id
  FROM "meals"
)
UPDATE "meal_attendances" ma
SET "meal_id" = grouped.canonical_id
FROM meal_groups grouped
WHERE ma."meal_id" = grouped."id"
  AND grouped."id" <> grouped.canonical_id;

WITH aggregate_state AS (
  SELECT
    "mess_id",
    "name",
    "scheduled_date",
    BOOL_OR("is_locked" OR "status" = 'LOCKED'::"MealStatus") AS is_locked,
    BOOL_OR("status" = 'CONFIRMED'::"MealStatus") AS has_confirmed,
    BOOL_AND("status" = 'CANCELLED'::"MealStatus") AS all_cancelled,
    MIN("created_at") AS first_created_at
  FROM "meals"
  GROUP BY "mess_id", "name", "scheduled_date"
),
canonical_meals AS (
  SELECT DISTINCT ON ("mess_id", "name", "scheduled_date")
    "id", "mess_id", "name", "scheduled_date"
  FROM "meals"
  ORDER BY "mess_id", "name", "scheduled_date", "created_at", "id"
)
UPDATE "meals" meal
SET
  "is_locked" = aggregate.is_locked,
  "status" = CASE
    WHEN aggregate.is_locked THEN 'LOCKED'::"MealStatus"
    WHEN aggregate.has_confirmed THEN 'CONFIRMED'::"MealStatus"
    WHEN aggregate.all_cancelled THEN 'CANCELLED'::"MealStatus"
    ELSE 'PENDING'::"MealStatus"
  END,
  "created_at" = aggregate.first_created_at,
  "updated_at" = CURRENT_TIMESTAMP
FROM aggregate_state aggregate
JOIN canonical_meals canonical
  ON canonical."mess_id" = aggregate."mess_id"
 AND canonical."name" = aggregate."name"
 AND canonical."scheduled_date" = aggregate."scheduled_date"
WHERE meal."id" = canonical."id";

WITH ranked_meals AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "mess_id", "name", "scheduled_date"
      ORDER BY "created_at", "id"
    ) AS meal_rank
  FROM "meals"
)
DELETE FROM "meals" meal
USING ranked_meals ranked
WHERE meal."id" = ranked."id"
  AND ranked.meal_rank > 1;

CREATE UNIQUE INDEX "meals_mess_id_name_scheduled_date_key"
  ON "meals"("mess_id", "name", "scheduled_date");

ALTER TABLE "messes"
  ADD CONSTRAINT "messes_meal_deadline_reminder_minutes_check"
  CHECK ("meal_deadline_reminder_minutes" BETWEEN 5 AND 720);
