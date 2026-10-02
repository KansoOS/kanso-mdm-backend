CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "tokenHash" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeviceEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "DeviceEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Device_tokenHash_key" ON "Device"("tokenHash");
CREATE UNIQUE INDEX "Policy_version_key" ON "Policy"("version");
CREATE UNIQUE INDEX "DeviceEvent_deviceId_eventId_key" ON "DeviceEvent"("deviceId", "eventId");
CREATE INDEX "DeviceEvent_deviceId_occurredAt_idx" ON "DeviceEvent"("deviceId", "occurredAt");
ALTER TABLE "DeviceEvent" ADD CONSTRAINT "DeviceEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
