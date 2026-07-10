-- AlterTable
ALTER TABLE "campaign_enrollments" ADD COLUMN     "extraFeeAmount" DECIMAL(10,2),
ADD COLUMN     "extraFeeType" TEXT;

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "enableExtraRegistrationFee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "extraRegistrationFee" DECIMAL(10,2) NOT NULL DEFAULT 2000;
