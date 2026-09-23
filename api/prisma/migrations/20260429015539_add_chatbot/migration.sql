-- CreateTable
CREATE TABLE "w1_chat_message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "w1_chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "w1_chat_message_sessionId_createdAt_idx" ON "w1_chat_message"("sessionId", "createdAt");
