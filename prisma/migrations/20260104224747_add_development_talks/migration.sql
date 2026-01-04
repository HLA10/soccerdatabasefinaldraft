-- CreateEnum
CREATE TYPE "TalkCategory" AS ENUM ('TECHNICAL', 'TACTICAL', 'PHYSICAL', 'MENTAL', 'BEHAVIOR');

-- CreateTable
CREATE TABLE "development_talks" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "category" "TalkCategory" NOT NULL,
    "notes" TEXT NOT NULL,
    "goals" TEXT,
    "actionPoints" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "development_talks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "development_talks" ADD CONSTRAINT "development_talks_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development_talks" ADD CONSTRAINT "development_talks_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
