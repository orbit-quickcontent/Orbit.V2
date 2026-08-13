ALTER TABLE "Partner" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
ALTER TABLE "Partner" ADD COLUMN "lastLocationAt" TIMESTAMP(3);
CREATE INDEX "Partner_lastSeenAt_idx" ON "Partner"("lastSeenAt");
