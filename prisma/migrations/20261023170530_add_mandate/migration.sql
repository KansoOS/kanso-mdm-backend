-- CreateTable
CREATE TABLE "Mandate" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "scope" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mandate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "Helper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "Helper"("id") ON DELETE SET NULL ON UPDATE CASCADE;
