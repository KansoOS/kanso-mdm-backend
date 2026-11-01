-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "pseudonym" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_spaceId_pseudonym_key" ON "Device"("spaceId", "pseudonym");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
