-- CreateTable
CREATE TABLE "RateLimitHit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "QueueEntry_date_status_assignedToId_queueNumber_idx" ON "QueueEntry"("date", "status", "assignedToId", "queueNumber");

-- CreateIndex
CREATE INDEX "QueueEntry_patientPhone_date_idx" ON "QueueEntry"("patientPhone", "date");
