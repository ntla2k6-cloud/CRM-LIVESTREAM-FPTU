-- Kho thiết bị (2026-11-26). Chạy 1 lần trên DB production; chỉ tạo bảng mới.
-- CreateTable
CREATE TABLE "EquipmentCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "categoryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "managerId" TEXT,
    "holderId" TEXT,
    "dueDate" TIMESTAMP(3),
    "note" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentHistory" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "status" TEXT,
    "changes" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentCategory_name_key" ON "EquipmentCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_code_key" ON "Equipment"("code");

-- CreateIndex
CREATE INDEX "Equipment_deletedAt_status_idx" ON "Equipment"("deletedAt", "status");

-- CreateIndex
CREATE INDEX "EquipmentHistory_equipmentId_createdAt_idx" ON "EquipmentHistory"("equipmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EquipmentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentHistory" ADD CONSTRAINT "EquipmentHistory_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Danh mục mặc định (Admin sửa/xóa/thêm được trên giao diện)
INSERT INTO "EquipmentCategory" ("id", "name", "description") VALUES
  ('cat_mua_sam', 'Mua sắm', 'Thiết bị tổ chức đầu tư, mua mới'),
  ('cat_tu_quan_ly', 'Tự quản lý', 'Thiết bị tổ chức tự quản lý hoặc được cấp từ nguồn nội bộ'),
  ('cat_ca_nhan', 'Của cá nhân', 'Thiết bị của cá nhân, đăng ký quản lý trong hệ thống')
ON CONFLICT ("name") DO NOTHING;
