-- AddColumn
ALTER TABLE "User" ADD COLUMN "name" TEXT;

-- Backfill existing users before making the column required.
UPDATE "User"
SET "name" = split_part("email", '@', 1)
WHERE "name" IS NULL;

-- MakeRequired
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;
