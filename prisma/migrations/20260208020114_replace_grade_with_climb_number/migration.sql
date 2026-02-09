-- CreateEnum
CREATE TYPE "CompStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "hashedPassword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "CompStatus" NOT NULL DEFAULT 'DRAFT',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoAdmin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "compId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Climb" (
    "id" TEXT NOT NULL,
    "compId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "climbNumber" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "pointConfig" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Climb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "compId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "climbId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "topped" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Comp_code_key" ON "Comp"("code");

-- CreateIndex
CREATE INDEX "Comp_code_idx" ON "Comp"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CoAdmin_userId_compId_key" ON "CoAdmin"("userId", "compId");

-- CreateIndex
CREATE INDEX "Climb_compId_idx" ON "Climb"("compId");

-- CreateIndex
CREATE INDEX "Participant_compId_idx" ON "Participant"("compId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_compId_deviceId_key" ON "Participant"("compId", "deviceId");

-- CreateIndex
CREATE INDEX "Score_climbId_idx" ON "Score"("climbId");

-- CreateIndex
CREATE INDEX "Score_participantId_idx" ON "Score"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Score_participantId_climbId_key" ON "Score"("participantId", "climbId");

-- AddForeignKey
ALTER TABLE "Comp" ADD CONSTRAINT "Comp_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoAdmin" ADD CONSTRAINT "CoAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoAdmin" ADD CONSTRAINT "CoAdmin_compId_fkey" FOREIGN KEY ("compId") REFERENCES "Comp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Climb" ADD CONSTRAINT "Climb_compId_fkey" FOREIGN KEY ("compId") REFERENCES "Comp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_compId_fkey" FOREIGN KEY ("compId") REFERENCES "Comp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_climbId_fkey" FOREIGN KEY ("climbId") REFERENCES "Climb"("id") ON DELETE CASCADE ON UPDATE CASCADE;
