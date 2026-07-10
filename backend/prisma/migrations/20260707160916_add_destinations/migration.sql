-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'driver', 'student');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "BusLine" AS ENUM ('JEBALI', 'BAHRY');

-- CreateEnum
CREATE TYPE "TripPeriod" AS ENUM ('MORNING', 'RETURN');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('MONTHLY', 'THREE_WEEKS', 'FOUR_WEEKS', 'DAILY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'partial', 'unpaid', 'overdue');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('pending', 'active', 'expired', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'transfer', 'card');

-- CreateEnum
CREATE TYPE "BusStatus" AS ENUM ('active', 'maintenance', 'inactive');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('LINE', 'HOME');

-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ActiveBusStatus" AS ENUM ('AVAILABLE', 'LOADING', 'DEPARTED', 'ARRIVED', 'CANCELLED', 'BROKEN_DOWN', 'REPLACED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('WAITING', 'ASSIGNED', 'DEPARTED');

-- CreateEnum
CREATE TYPE "DistanceCategory" AS ENUM ('NEAR', 'MEDIUM', 'FAR');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('PERMANENT', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmergencyReportStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'driver',
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "lastIp" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dailyPrice" DECIMAL(10,2),
    "threeWeeksPrice" DECIMAL(10,2),
    "fourWeeksPrice" DECIMAL(10,2),
    "homeNearSurcharge" DECIMAL(10,2),
    "homeMediumSurcharge" DECIMAL(10,2),
    "homeFarSurcharge" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "destinationId" TEXT,
    "plan" "SubscriptionType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "parentRelation" TEXT,
    "address" TEXT,
    "zone" TEXT,
    "destinationId" TEXT,
    "major" TEXT,
    "level" TEXT,
    "institutionName" TEXT,
    "offDays" JSONB DEFAULT '[]',
    "pickupLocation" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "transportMode" "TransportMode" NOT NULL DEFAULT 'LINE',
    "homeAddress" TEXT,
    "homeDeliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "homeDeliveryFeeDaily" DECIMAL(10,2) DEFAULT 0,
    "homeDeliveryFeeThreeWeeks" DECIMAL(10,2) DEFAULT 0,
    "homeDeliveryFeeFourWeeks" DECIMAL(10,2) DEFAULT 0,
    "homeNotes" TEXT,
    "homeDeliveryActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buses" (
    "id" TEXT NOT NULL,
    "busNumber" TEXT,
    "plateNumber" TEXT,
    "capacity" INTEGER NOT NULL,
    "vehicleType" TEXT,
    "driverName" TEXT,
    "model" TEXT,
    "color" TEXT,
    "status" "BusStatus" NOT NULL DEFAULT 'active',
    "driverId" TEXT,
    "primaryPhone" TEXT,
    "secondaryPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_students" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pickupTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bus_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_transfers" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromBusId" TEXT NOT NULL,
    "toBusId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "type" "TransferType" NOT NULL DEFAULT 'PERMANENT',
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "period" "TripPeriod" NOT NULL DEFAULT 'MORNING',
    "line" "BusLine" NOT NULL DEFAULT 'JEBALI',
    "pickupTime" TEXT,
    "dropoffTime" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'scheduled',
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_operations" (
    "id" TEXT NOT NULL,
    "operationDate" DATE NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_buses" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "line" "BusLine",
    "capacitySnapshot" INTEGER NOT NULL,
    "status" "ActiveBusStatus" NOT NULL DEFAULT 'AVAILABLE',
    "returnCompletedAt" TIMESTAMP(3),
    "currentStudentIdx" INTEGER NOT NULL DEFAULT 0,
    "skippedStudentIds" TEXT DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "active_buses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_queue" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredLine" "BusLine",
    "transportMode" "TransportMode" NOT NULL DEFAULT 'LINE',
    "notes" TEXT,
    "status" "ReturnStatus" NOT NULL DEFAULT 'WAITING',

    CONSTRAINT "return_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_loads" (
    "id" TEXT NOT NULL,
    "activeBusId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" TEXT NOT NULL,
    "exceptionReason" TEXT,
    "departedAt" TIMESTAMP(3),
    "droppedOffAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bus_loads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'discount',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountPercent" DECIMAL(5,2),
    "discountExpiry" TIMESTAMP(3),
    "hasEarlyDiscount" BOOLEAN NOT NULL DEFAULT false,
    "discountStart" TIMESTAMP(3),
    "maxStudents" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_enrollments" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "areaId" TEXT,
    "baseAmount" DECIMAL(10,2) NOT NULL,
    "surcharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "receiptImage" TEXT,
    "receiptStatus" "ReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "SubscriptionType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "executionDate" DATE,
    "amount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "homeDeliveryFee" DECIMAL(10,2),
    "notes" TEXT,
    "durationWeeks" INTEGER,
    "selectedDays" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_execution_dates" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "executionDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "daily_execution_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'present',
    "contacted" BOOLEAN NOT NULL DEFAULT false,
    "contactTime" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_sheets" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedById" TEXT NOT NULL,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_sheet_students" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "major" TEXT,
    "level" TEXT,
    "institutionName" TEXT,
    "pickupLocation" TEXT,
    "pickupTime" TEXT,
    "transportMode" "TransportMode" NOT NULL DEFAULT 'LINE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isTransfer" BOOLEAN NOT NULL DEFAULT false,
    "transferFrom" TEXT,
    "offDays" JSONB DEFAULT '[]',
    "homeNotes" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_sheet_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_student_orders" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isTemporary" BOOLEAN NOT NULL DEFAULT false,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bus_student_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'INFO',
    "targetRoute" TEXT,
    "dedupKey" TEXT,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_sheet_versions" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "generatedById" TEXT NOT NULL,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_sheet_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_reports" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "status" "EmergencyReportStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_logs" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "busNumber" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "details" JSONB,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_financial" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" TIMESTAMP(3),
    "suspendedById" TEXT,
    "suspensionReason" TEXT,
    "reactivatedAt" TIMESTAMP(3),
    "gracePeriodEnd" DATE,
    "graceReason" TEXT,
    "lastReminderSentAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_financial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_studentId_key" ON "users"("studentId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_name_key" ON "destinations"("name");

-- CreateIndex
CREATE INDEX "destinations_isActive_idx" ON "destinations"("isActive");

-- CreateIndex
CREATE INDEX "destinations_sortOrder_idx" ON "destinations"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_areas_name_key" ON "pricing_areas"("name");

-- CreateIndex
CREATE INDEX "pricing_areas_isActive_idx" ON "pricing_areas"("isActive");

-- CreateIndex
CREATE INDEX "pricing_zoneId_idx" ON "pricing"("zoneId");

-- CreateIndex
CREATE INDEX "pricing_destinationId_idx" ON "pricing"("destinationId");

-- CreateIndex
CREATE INDEX "pricing_plan_idx" ON "pricing"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_zoneId_destinationId_plan_key" ON "pricing"("zoneId", "destinationId", "plan");

-- CreateIndex
CREATE INDEX "students_status_idx" ON "students"("status");

-- CreateIndex
CREATE INDEX "students_zone_idx" ON "students"("zone");

-- CreateIndex
CREATE INDEX "students_name_idx" ON "students"("name");

-- CreateIndex
CREATE INDEX "students_transportMode_idx" ON "students"("transportMode");

-- CreateIndex
CREATE UNIQUE INDEX "buses_busNumber_key" ON "buses"("busNumber");

-- CreateIndex
CREATE UNIQUE INDEX "buses_plateNumber_key" ON "buses"("plateNumber");

-- CreateIndex
CREATE INDEX "buses_status_idx" ON "buses"("status");

-- CreateIndex
CREATE INDEX "buses_driverId_idx" ON "buses"("driverId");

-- CreateIndex
CREATE INDEX "bus_students_busId_idx" ON "bus_students"("busId");

-- CreateIndex
CREATE INDEX "bus_students_studentId_idx" ON "bus_students"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "bus_students_studentId_key" ON "bus_students"("studentId");

-- CreateIndex
CREATE INDEX "student_transfers_studentId_idx" ON "student_transfers"("studentId");

-- CreateIndex
CREATE INDEX "student_transfers_fromBusId_idx" ON "student_transfers"("fromBusId");

-- CreateIndex
CREATE INDEX "student_transfers_toBusId_idx" ON "student_transfers"("toBusId");

-- CreateIndex
CREATE INDEX "student_transfers_isActive_idx" ON "student_transfers"("isActive");

-- CreateIndex
CREATE INDEX "student_transfers_endDate_idx" ON "student_transfers"("endDate");

-- CreateIndex
CREATE INDEX "assignments_busId_idx" ON "assignments"("busId");

-- CreateIndex
CREATE INDEX "assignments_date_idx" ON "assignments"("date");

-- CreateIndex
CREATE INDEX "assignments_line_idx" ON "assignments"("line");

-- CreateIndex
CREATE INDEX "assignments_period_idx" ON "assignments"("period");

-- CreateIndex
CREATE INDEX "assignments_status_idx" ON "assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_studentId_date_period_key" ON "assignments"("studentId", "date", "period");

-- CreateIndex
CREATE UNIQUE INDEX "daily_operations_operationDate_key" ON "daily_operations"("operationDate");

-- CreateIndex
CREATE INDEX "daily_operations_operationDate_idx" ON "daily_operations"("operationDate");

-- CreateIndex
CREATE INDEX "daily_operations_status_idx" ON "daily_operations"("status");

-- CreateIndex
CREATE INDEX "active_buses_operationId_idx" ON "active_buses"("operationId");

-- CreateIndex
CREATE INDEX "active_buses_busId_idx" ON "active_buses"("busId");

-- CreateIndex
CREATE INDEX "active_buses_status_idx" ON "active_buses"("status");

-- CreateIndex
CREATE INDEX "return_queue_operationId_idx" ON "return_queue"("operationId");

-- CreateIndex
CREATE INDEX "return_queue_studentId_idx" ON "return_queue"("studentId");

-- CreateIndex
CREATE INDEX "return_queue_status_idx" ON "return_queue"("status");

-- CreateIndex
CREATE INDEX "bus_loads_activeBusId_idx" ON "bus_loads"("activeBusId");

-- CreateIndex
CREATE INDEX "bus_loads_studentId_idx" ON "bus_loads"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "bus_loads_activeBusId_studentId_key" ON "bus_loads"("activeBusId", "studentId");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_isActive_idx" ON "campaigns"("isActive");

-- CreateIndex
CREATE INDEX "campaign_enrollments_studentId_idx" ON "campaign_enrollments"("studentId");

-- CreateIndex
CREATE INDEX "campaign_enrollments_receiptStatus_idx" ON "campaign_enrollments"("receiptStatus");

-- CreateIndex
CREATE INDEX "subscriptions_studentId_idx" ON "subscriptions"("studentId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_paymentStatus_idx" ON "subscriptions"("paymentStatus");

-- CreateIndex
CREATE INDEX "subscriptions_endDate_idx" ON "subscriptions"("endDate");

-- CreateIndex
CREATE INDEX "subscriptions_executionDate_idx" ON "subscriptions"("executionDate");

-- CreateIndex
CREATE INDEX "daily_execution_dates_executionDate_idx" ON "daily_execution_dates"("executionDate");

-- CreateIndex
CREATE INDEX "daily_execution_dates_subscriptionId_idx" ON "daily_execution_dates"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_execution_dates_subscriptionId_executionDate_key" ON "daily_execution_dates"("subscriptionId", "executionDate");

-- CreateIndex
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "payments_date_idx" ON "payments"("date");

-- CreateIndex
CREATE INDEX "payments_method_idx" ON "payments"("method");

-- CreateIndex
CREATE INDEX "attendances_busId_idx" ON "attendances"("busId");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_studentId_date_key" ON "attendances"("studentId", "date");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "weekly_sheets_busId_idx" ON "weekly_sheets"("busId");

-- CreateIndex
CREATE INDEX "weekly_sheets_weekStart_idx" ON "weekly_sheets"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_sheets_busId_weekStart_key" ON "weekly_sheets"("busId", "weekStart");

-- CreateIndex
CREATE INDEX "weekly_sheet_students_sheetId_idx" ON "weekly_sheet_students"("sheetId");

-- CreateIndex
CREATE INDEX "weekly_sheet_students_studentId_idx" ON "weekly_sheet_students"("studentId");

-- CreateIndex
CREATE INDEX "bus_student_orders_busId_idx" ON "bus_student_orders"("busId");

-- CreateIndex
CREATE INDEX "bus_student_orders_busId_date_idx" ON "bus_student_orders"("busId", "date");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_dedupKey_idx" ON "notifications"("dedupKey");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_key_key" ON "message_templates"("key");

-- CreateIndex
CREATE INDEX "message_templates_key_idx" ON "message_templates"("key");

-- CreateIndex
CREATE INDEX "weekly_sheet_versions_sheetId_idx" ON "weekly_sheet_versions"("sheetId");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_sheet_versions_sheetId_version_key" ON "weekly_sheet_versions"("sheetId", "version");

-- CreateIndex
CREATE INDEX "emergency_reports_busId_idx" ON "emergency_reports"("busId");

-- CreateIndex
CREATE INDEX "emergency_reports_status_idx" ON "emergency_reports"("status");

-- CreateIndex
CREATE INDEX "emergency_logs_busId_idx" ON "emergency_logs"("busId");

-- CreateIndex
CREATE INDEX "emergency_logs_createdAt_idx" ON "emergency_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "student_financial_studentId_key" ON "student_financial"("studentId");

-- CreateIndex
CREATE INDEX "student_financial_studentId_idx" ON "student_financial"("studentId");

-- CreateIndex
CREATE INDEX "student_financial_isSuspended_idx" ON "student_financial"("isSuspended");

-- CreateIndex
CREATE INDEX "student_financial_gracePeriodEnd_idx" ON "student_financial"("gracePeriodEnd");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing" ADD CONSTRAINT "pricing_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "pricing_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing" ADD CONSTRAINT "pricing_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_students" ADD CONSTRAINT "bus_students_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_students" ADD CONSTRAINT "bus_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transfers" ADD CONSTRAINT "student_transfers_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transfers" ADD CONSTRAINT "student_transfers_fromBusId_fkey" FOREIGN KEY ("fromBusId") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transfers" ADD CONSTRAINT "student_transfers_toBusId_fkey" FOREIGN KEY ("toBusId") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_operations" ADD CONSTRAINT "daily_operations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_buses" ADD CONSTRAINT "active_buses_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "daily_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_buses" ADD CONSTRAINT "active_buses_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_buses" ADD CONSTRAINT "active_buses_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_queue" ADD CONSTRAINT "return_queue_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "daily_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_queue" ADD CONSTRAINT "return_queue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_loads" ADD CONSTRAINT "bus_loads_activeBusId_fkey" FOREIGN KEY ("activeBusId") REFERENCES "active_buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_loads" ADD CONSTRAINT "bus_loads_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_loads" ADD CONSTRAINT "bus_loads_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_enrollments" ADD CONSTRAINT "campaign_enrollments_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_enrollments" ADD CONSTRAINT "campaign_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_enrollments" ADD CONSTRAINT "campaign_enrollments_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "pricing_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_enrollments" ADD CONSTRAINT "campaign_enrollments_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_execution_dates" ADD CONSTRAINT "daily_execution_dates_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_sheets" ADD CONSTRAINT "weekly_sheets_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_sheets" ADD CONSTRAINT "weekly_sheets_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_sheet_students" ADD CONSTRAINT "weekly_sheet_students_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "weekly_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_student_orders" ADD CONSTRAINT "bus_student_orders_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_student_orders" ADD CONSTRAINT "bus_student_orders_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_sheet_versions" ADD CONSTRAINT "weekly_sheet_versions_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "weekly_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_sheet_versions" ADD CONSTRAINT "weekly_sheet_versions_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_reports" ADD CONSTRAINT "emergency_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_logs" ADD CONSTRAINT "emergency_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_financial" ADD CONSTRAINT "student_financial_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_financial" ADD CONSTRAINT "student_financial_suspendedById_fkey" FOREIGN KEY ("suspendedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
