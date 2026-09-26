DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Supply" WHERE "currentQuantity" <> trunc("currentQuantity")
  ) OR EXISTS (
    SELECT 1 FROM "BasketSupply" WHERE "quantity" <> trunc("quantity")
  ) OR EXISTS (
    SELECT 1 FROM "StockMovement" WHERE "quantity" <> trunc("quantity")
  ) THEN
    RAISE EXCEPTION 'Stock quantities contain fractions; convert them to whole units before applying this migration.';
  END IF;

  IF EXISTS (SELECT 1 FROM "Supply" WHERE "currentQuantity" < 0)
    OR EXISTS (SELECT 1 FROM "BasketSupply" WHERE "quantity" <= 0)
    OR EXISTS (SELECT 1 FROM "StockMovement" WHERE "quantity" <= 0) THEN
    RAISE EXCEPTION 'Stock quantities contain values outside the allowed range.';
  END IF;
END $$;

ALTER TABLE "Supply"
  ALTER COLUMN "currentQuantity" TYPE INTEGER USING "currentQuantity"::INTEGER;

ALTER TABLE "BasketSupply"
  ALTER COLUMN "quantity" TYPE INTEGER USING "quantity"::INTEGER;

ALTER TABLE "StockMovement"
  ALTER COLUMN "quantity" TYPE INTEGER USING "quantity"::INTEGER;

ALTER TABLE "Supply"
  ADD CONSTRAINT "Supply_currentQuantity_nonnegative_check" CHECK ("currentQuantity" >= 0);

ALTER TABLE "BasketSupply"
  ADD CONSTRAINT "BasketSupply_quantity_positive_check" CHECK ("quantity" > 0);

ALTER TABLE "StockMovement"
  ADD CONSTRAINT "StockMovement_quantity_positive_check" CHECK ("quantity" > 0);
