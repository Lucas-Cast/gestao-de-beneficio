-- CreateEnum
CREATE TYPE "BeneficiarySex" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "StockUnit" AS ENUM ('UNIT', 'KILOGRAM', 'GRAM', 'LITER', 'MILLILITER', 'PACKAGE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COMMON');

-- Migrate the existing soft-delete flag to a timestamp while preserving deleted users.
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
UPDATE "User" SET "deletedAt" = CURRENT_TIMESTAMP WHERE "isDeleted" = true;
DROP INDEX "User_isDeleted_idx";
ALTER TABLE "User" DROP COLUMN "isDeleted";

-- Add default role to existing and newly created users.
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'COMMON';

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "sex" "BeneficiarySex" NOT NULL,
    "phone" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" "StockUnit" NOT NULL,
    "currentQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Basket" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Basket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BasketSupply" (
    "id" TEXT NOT NULL,
    "basketId" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "BasketSupply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BasketDelivery" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "basketId" TEXT NOT NULL,
    "deliveredById" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "BasketDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
CREATE UNIQUE INDEX "Beneficiary_cpf_key" ON "Beneficiary"("cpf");
CREATE UNIQUE INDEX "Beneficiary_addressId_key" ON "Beneficiary"("addressId");
CREATE UNIQUE INDEX "Supply_name_key" ON "Supply"("name");
CREATE INDEX "Basket_deletedAt_idx" ON "Basket"("deletedAt");
CREATE INDEX "BasketSupply_deletedAt_idx" ON "BasketSupply"("deletedAt");
CREATE UNIQUE INDEX "BasketSupply_basketId_supplyId_key" ON "BasketSupply"("basketId", "supplyId");
CREATE INDEX "BasketDelivery_beneficiaryId_createdAt_idx" ON "BasketDelivery"("beneficiaryId", "createdAt");
CREATE INDEX "BasketDelivery_basketId_createdAt_idx" ON "BasketDelivery"("basketId", "createdAt");
CREATE INDEX "BasketDelivery_deliveredById_createdAt_idx" ON "BasketDelivery"("deliveredById", "createdAt");
CREATE INDEX "BasketDelivery_deletedAt_idx" ON "BasketDelivery"("deletedAt");
CREATE INDEX "StockMovement_supplyId_createdAt_idx" ON "StockMovement"("supplyId", "createdAt");
CREATE INDEX "StockMovement_performedById_createdAt_idx" ON "StockMovement"("performedById", "createdAt");

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BasketSupply" ADD CONSTRAINT "BasketSupply_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES "Basket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BasketSupply" ADD CONSTRAINT "BasketSupply_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BasketDelivery" ADD CONSTRAINT "BasketDelivery_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BasketDelivery" ADD CONSTRAINT "BasketDelivery_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES "Basket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BasketDelivery" ADD CONSTRAINT "BasketDelivery_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
