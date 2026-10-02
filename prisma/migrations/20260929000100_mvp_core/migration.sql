CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Space" ("id", "displayName")
SELECT '00000000-0000-0000-0000-000000000001', 'Legacy POC Space'
WHERE EXISTS (SELECT 1 FROM "Device") OR EXISTS (SELECT 1 FROM "Policy");

CREATE TABLE "PairingCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spaceId" TEXT NOT NULL,
    CONSTRAINT "PairingCode_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Device" ADD COLUMN "spaceId" TEXT;
ALTER TABLE "Device" ADD COLUMN "pushTopic" TEXT;
ALTER TABLE "Device" ADD COLUMN "appliedPolicyVersion" INTEGER NOT NULL DEFAULT 0;
UPDATE "Device" SET "spaceId" = '00000000-0000-0000-0000-000000000001';
UPDATE "Device" SET "pushTopic" = 'kanso-' || md5("id" || random()::text || clock_timestamp()::text);
ALTER TABLE "Device" ALTER COLUMN "spaceId" SET NOT NULL;
ALTER TABLE "Device" ALTER COLUMN "pushTopic" SET NOT NULL;

ALTER TABLE "Policy" ADD COLUMN "spaceId" TEXT;
UPDATE "Policy" SET "spaceId" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "Policy" ALTER COLUMN "spaceId" SET NOT NULL;

ALTER TABLE "DeviceEvent" ADD COLUMN "policyVersion" INTEGER;

DROP INDEX "Policy_version_key";

CREATE UNIQUE INDEX "PairingCode_codeHash_key" ON "PairingCode"("codeHash");
CREATE INDEX "PairingCode_spaceId_expiresAt_idx" ON "PairingCode"("spaceId", "expiresAt");
CREATE UNIQUE INDEX "Device_pushTopic_key" ON "Device"("pushTopic");
CREATE INDEX "Device_spaceId_revokedAt_idx" ON "Device"("spaceId", "revokedAt");
CREATE UNIQUE INDEX "Policy_spaceId_version_key" ON "Policy"("spaceId", "version");
CREATE INDEX "Policy_spaceId_createdAt_idx" ON "Policy"("spaceId", "createdAt");
CREATE INDEX "DeviceEvent_type_occurredAt_idx" ON "DeviceEvent"("type", "occurredAt");

ALTER TABLE "PairingCode" ADD CONSTRAINT "PairingCode_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Device" ADD CONSTRAINT "Device_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
