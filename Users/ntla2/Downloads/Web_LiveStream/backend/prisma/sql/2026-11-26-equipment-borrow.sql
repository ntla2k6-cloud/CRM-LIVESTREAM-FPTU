-- Kho thiết bị: đồ mượn, ảnh hóa đơn, người ngoài (2026-11-26). Chỉ thêm cột.
-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "holderName" TEXT,
ADD COLUMN     "invoiceImage" TEXT,
ADD COLUMN     "lenderContact" TEXT,
ADD COLUMN     "lenderDueDate" TIMESTAMP(3),
ADD COLUMN     "lenderName" TEXT,
ADD COLUMN     "managerName" TEXT,
ADD COLUMN     "returnedToLenderAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EquipmentHistory" ADD COLUMN     "fromName" TEXT,
ADD COLUMN     "toName" TEXT;


INSERT INTO "EquipmentCategory" ("id", "name", "description") VALUES
  ('cat_do_muon', 'Đồ mượn của Phòng', 'Đồ mượn của phòng ban/người khác — ghi mượn của ai, hạn trả để sau này trả')
ON CONFLICT ("name") DO NOTHING;
