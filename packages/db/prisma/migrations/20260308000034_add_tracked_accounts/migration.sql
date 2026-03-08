-- CreateTable
CREATE TABLE "TrackedAccount" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackedAccount_username_key" ON "TrackedAccount"("username");
