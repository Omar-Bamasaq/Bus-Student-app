-- CreateEnum
CREATE TYPE "SaturdayOpStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "saturday_operations" (
    "id" TEXT NOT NULL,
    "operationDate" DATE NOT NULL,
    "status" "SaturdayOpStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saturday_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saturday_active_buses" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "capacitySnapshot" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saturday_active_buses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saturday_bus_loads" (
    "id" TEXT NOT NULL,
    "activeBusId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "pickupTime" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departedAt" TIMESTAMP(3),

    CONSTRAINT "saturday_bus_loads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saturday_operations_operationDate_key" ON "saturday_operations"("operationDate");

-- CreateIndex
CREATE INDEX "saturday_operations_operationDate_idx" ON "saturday_operations"("operationDate");

-- CreateIndex
CREATE UNIQUE INDEX "saturday_active_buses_operationId_busId_key" ON "saturday_active_buses"("operationId", "busId");

-- CreateIndex
CREATE UNIQUE INDEX "saturday_bus_loads_activeBusId_studentId_key" ON "saturday_bus_loads"("activeBusId", "studentId");

-- AddForeignKey
ALTER TABLE "saturday_operations" ADD CONSTRAINT "saturday_operations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saturday_active_buses" ADD CONSTRAINT "saturday_active_buses_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "saturday_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saturday_active_buses" ADD CONSTRAINT "saturday_active_buses_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saturday_active_buses" ADD CONSTRAINT "saturday_active_buses_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saturday_bus_loads" ADD CONSTRAINT "saturday_bus_loads_activeBusId_fkey" FOREIGN KEY ("activeBusId") REFERENCES "saturday_active_buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saturday_bus_loads" ADD CONSTRAINT "saturday_bus_loads_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
