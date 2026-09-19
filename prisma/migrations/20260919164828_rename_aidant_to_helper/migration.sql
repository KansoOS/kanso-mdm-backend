-- Rename table Aidant -> Helper (preserves data), plus its PK and unique index
ALTER TABLE "Aidant" RENAME TO "Helper";
ALTER TABLE "Helper" RENAME CONSTRAINT "Aidant_pkey" TO "Helper_pkey";
ALTER INDEX "Aidant_email_key" RENAME TO "Helper_email_key";
