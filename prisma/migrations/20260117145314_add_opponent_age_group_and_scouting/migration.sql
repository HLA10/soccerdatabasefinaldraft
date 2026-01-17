-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "opponentAgeGroup" TEXT;

-- CreateTable
CREATE TABLE "scouting_reports" (
    "id" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "clubId" TEXT,
    "teamId" TEXT,
    "ageGroup" TEXT,
    "notes" TEXT NOT NULL,
    "dateObserved" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scouting_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scouting_reports" ADD CONSTRAINT "scouting_reports_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scouting_reports" ADD CONSTRAINT "scouting_reports_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scouting_reports" ADD CONSTRAINT "scouting_reports_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
