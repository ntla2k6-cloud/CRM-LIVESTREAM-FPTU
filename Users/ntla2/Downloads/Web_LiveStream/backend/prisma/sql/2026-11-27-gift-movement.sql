-- Lịch sử kho quà + Shipment.giftId (2026-11-27). Chỉ thêm bảng/cột.
-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "giftId" INTEGER;

-- CreateTable
CREATE TABLE "GiftMovement" (
    "id" TEXT NOT NULL,
    "giftId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "shipmentId" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GiftMovement_giftId_createdAt_idx" ON "GiftMovement"("giftId", "createdAt");

-- AddForeignKey
ALTER TABLE "GiftMovement" ADD CONSTRAINT "GiftMovement_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

