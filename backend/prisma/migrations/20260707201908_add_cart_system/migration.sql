-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'DRAFT',
    "receiptImage" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "type" "SubscriptionType" NOT NULL,
    "zoneId" TEXT,
    "destinationId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "homeDeliveryFee" DECIMAL(10,2),
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "carts_studentId_idx" ON "carts"("studentId");

-- CreateIndex
CREATE INDEX "carts_status_idx" ON "carts"("status");

-- CreateIndex
CREATE INDEX "cart_items_cartId_idx" ON "cart_items"("cartId");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "pricing_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
