-- Model one accounting transaction as an expense header with one or more
-- purchased line items. The header amount remains a cached accounting total so
-- existing billing and ledger aggregates stay efficient.
CREATE TABLE "expense_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "expense_id" UUID NOT NULL,
  "item_name" VARCHAR(150) NOT NULL,
  "quantity" DECIMAL(10, 3),
  "unit" VARCHAR(30),
  "amount" DECIMAL(12, 2) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "expense_items_expense_id_fkey"
    FOREIGN KEY ("expense_id") REFERENCES "expenses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "expense_items_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "expense_items_name_not_blank" CHECK (BTRIM("item_name") <> ''),
  CONSTRAINT "expense_items_quantity_non_negative"
    CHECK ("quantity" IS NULL OR "quantity" >= 0),
  CONSTRAINT "expense_items_sort_order_non_negative" CHECK ("sort_order" >= 0)
);

CREATE UNIQUE INDEX "expense_items_expense_id_sort_order_key"
  ON "expense_items"("expense_id", "sort_order");
CREATE INDEX "expense_items_expense_id_idx"
  ON "expense_items"("expense_id");

-- Preserve every historical expense as a one-line transaction before removing
-- the denormalized item columns.
INSERT INTO "expense_items" (
  "expense_id",
  "item_name",
  "quantity",
  "unit",
  "amount",
  "sort_order",
  "created_at",
  "updated_at"
)
SELECT
  "id",
  COALESCE(
    NULLIF(BTRIM("item_name"), ''),
    INITCAP(REPLACE("category"::text, '_', ' '))
  ),
  "quantity",
  NULLIF(BTRIM("unit"), ''),
  "amount",
  0,
  "created_at",
  "updated_at"
FROM "expenses";

ALTER TABLE "expenses"
  DROP COLUMN "item_name",
  DROP COLUMN "quantity",
  DROP COLUMN "unit";

-- Enforce the accounting invariant at commit time. Deferred checks allow the
-- application to replace line items and update the header total atomically in
-- either order while preventing mismatched data from being committed.
CREATE FUNCTION "assert_expense_item_total"("target_expense_id" UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  expected_total DECIMAL(12, 2);
  actual_total DECIMAL(12, 2);
  item_count BIGINT;
BEGIN
  SELECT "amount"
  INTO expected_total
  FROM "expenses"
  WHERE "id" = "target_expense_id";

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COUNT(*), COALESCE(SUM("amount"), 0)
  INTO item_count, actual_total
  FROM "expense_items"
  WHERE "expense_id" = "target_expense_id";

  IF item_count = 0 OR actual_total <> expected_total THEN
    RAISE EXCEPTION
      'Expense % amount (%) must equal the sum of its % line item(s) (%)',
      "target_expense_id", expected_total, item_count, actual_total
      USING ERRCODE = '23514';
  END IF;
END;
$$;

CREATE FUNCTION "check_expense_item_total_from_item"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM "assert_expense_item_total"(OLD."expense_id");
  ELSE
    PERFORM "assert_expense_item_total"(NEW."expense_id");
    IF TG_OP = 'UPDATE' AND OLD."expense_id" <> NEW."expense_id" THEN
      PERFORM "assert_expense_item_total"(OLD."expense_id");
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE FUNCTION "check_expense_item_total_from_expense"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM "assert_expense_item_total"(NEW."id");
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "expense_items_total_matches_header"
AFTER INSERT OR UPDATE OR DELETE ON "expense_items"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "check_expense_item_total_from_item"();

CREATE CONSTRAINT TRIGGER "expense_header_total_matches_items"
AFTER INSERT OR UPDATE ON "expenses"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "check_expense_item_total_from_expense"();
