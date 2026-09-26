ALTER TABLE "StockMovement" ADD COLUMN "basketDeliveryId" TEXT;

CREATE INDEX "StockMovement_basketDeliveryId_idx" ON "StockMovement"("basketDeliveryId");

ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_basketDeliveryId_fkey"
FOREIGN KEY ("basketDeliveryId") REFERENCES "BasketDelivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A delivery can only produce outgoing movements. Standalone movements remain valid.
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_delivery_out_check"
CHECK ("basketDeliveryId" IS NULL OR "type" = 'OUT');
