ALTER TABLE "WorkDispatch" ADD COLUMN "expiresAt" TIMESTAMP(3);
CREATE INDEX "WorkDispatch_expiresAt_idx" ON "WorkDispatch"("expiresAt");
