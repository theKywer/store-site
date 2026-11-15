ALTER TABLE "User"
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

UPDATE "User"
SET "emailVerifiedAt" = "createdAt"
WHERE "emailVerifiedAt" IS NULL;

CREATE TABLE "EmailVerification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerification_userId_key" ON "EmailVerification"("userId");
CREATE INDEX "EmailVerification_expiresAt_idx" ON "EmailVerification"("expiresAt");

ALTER TABLE "EmailVerification"
ADD CONSTRAINT "EmailVerification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
