-- Add synchronization models to the existing Space domain model.

CREATE TABLE "PairingCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spaceId" TEXT NOT NULL,
    CONSTRAINT "PairingCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "tokenHash" TEXT NOT NULL,
    "pushTopic" TEXT NOT NULL,
    "appliedPolicyVersion" INTEGER NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spaceId" TEXT NOT NULL,
    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spaceId" TEXT NOT NULL,
    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeviceEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "policyVersion" INTEGER,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "DeviceEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PairingCode_codeHash_key" ON "PairingCode"("codeHash");
CREATE INDEX "PairingCode_spaceId_expiresAt_idx" ON "PairingCode"("spaceId", "expiresAt");

CREATE UNIQUE INDEX "Device_tokenHash_key" ON "Device"("tokenHash");
CREATE UNIQUE INDEX "Device_pushTopic_key" ON "Device"("pushTopic");
CREATE INDEX "Device_spaceId_revokedAt_idx" ON "Device"("spaceId", "revokedAt");

CREATE UNIQUE INDEX "Policy_spaceId_version_key" ON "Policy"("spaceId", "version");
CREATE INDEX "Policy_spaceId_createdAt_idx" ON "Policy"("spaceId", "createdAt");

CREATE UNIQUE INDEX "DeviceEvent_deviceId_eventId_key" ON "DeviceEvent"("deviceId", "eventId");
CREATE INDEX "DeviceEvent_deviceId_occurredAt_idx" ON "DeviceEvent"("deviceId", "occurredAt");
CREATE INDEX "DeviceEvent_type_occurredAt_idx" ON "DeviceEvent"("type", "occurredAt");

ALTER TABLE "PairingCode"
ADD CONSTRAINT "PairingCode_spaceId_fkey"
FOREIGN KEY ("spaceId") REFERENCES "Space"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Device"
ADD CONSTRAINT "Device_spaceId_fkey"
FOREIGN KEY ("spaceId") REFERENCES "Space"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Policy"
ADD CONSTRAINT "Policy_spaceId_fkey"
FOREIGN KEY ("spaceId") REFERENCES "Space"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DeviceEvent"
ADD CONSTRAINT "DeviceEvent_deviceId_fkey"
FOREIGN KEY ("deviceId") REFERENCES "Device"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
