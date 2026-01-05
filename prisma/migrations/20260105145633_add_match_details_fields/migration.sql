-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('FRIENDLY', 'LEAGUE', 'CUP', 'TOURNAMENT');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "matchType" "MatchType" DEFAULT 'FRIENDLY',
ADD COLUMN     "opponentLogoUrl" TEXT,
ADD COLUMN     "opponentName" TEXT,
ADD COLUMN     "venueName" TEXT;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "logoUrl" TEXT;
