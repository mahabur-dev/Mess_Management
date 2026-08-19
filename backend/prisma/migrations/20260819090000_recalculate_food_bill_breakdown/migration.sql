-- Rebuild existing monthly bills with the new accounting contract:
-- meal_charge = communal meal-rate charge
-- food_bill   = meal_charge + assigned food expenses
INSERT INTO "monthly_billing_states" (
  "mess_id",
  "month",
  "status",
  "requested_at",
  "next_attempt_at"
)
SELECT DISTINCT
  "mess_id",
  "month",
  'DIRTY'::"BillingCalculationStatus",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "monthly_bills"
ON CONFLICT ("mess_id", "month") DO UPDATE SET
  "status" = 'DIRTY'::"BillingCalculationStatus",
  "revision" = "monthly_billing_states"."revision" + 1,
  "attempts" = 0,
  "requested_at" = CURRENT_TIMESTAMP,
  "started_at" = NULL,
  "calculated_at" = NULL,
  "next_attempt_at" = CURRENT_TIMESTAMP,
  "last_error" = NULL;
