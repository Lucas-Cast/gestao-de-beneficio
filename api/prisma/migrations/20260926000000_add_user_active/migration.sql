-- AddColumn
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Preserve existing accounts as active while making new accounts inactive.
ALTER TABLE "User" ALTER COLUMN "isActive" SET DEFAULT false;
