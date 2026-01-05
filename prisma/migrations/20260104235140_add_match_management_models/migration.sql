-- CreateEnum
CREATE TYPE "FormationType" AS ENUM ('ELEVEN_V_ELEVEN', 'NINE_V_NINE', 'SEVEN_V_SEVEN');

-- CreateEnum
CREATE TYPE "SquadStatus" AS ENUM ('CALLED', 'STARTING', 'BENCH');

-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUB_ON', 'SUB_OFF');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "awayTeamId" TEXT,
ADD COLUMN     "formationType" "FormationType" DEFAULT 'ELEVEN_V_ELEVEN',
ADD COLUMN     "homeTeamId" TEXT,
ADD COLUMN     "scoreAway" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scoreHome" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "time" TIMESTAMP(3),
ADD COLUMN     "venue" TEXT;

-- CreateTable
CREATE TABLE "game_squads" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "SquadStatus" NOT NULL DEFAULT 'CALLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_squads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formations" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "formationName" TEXT NOT NULL,
    "formationType" "FormationType" NOT NULL DEFAULT 'ELEVEN_V_ELEVEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineup_positions" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "positionCode" TEXT NOT NULL,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lineup_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_events" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,
    "type" "MatchEventType" NOT NULL,
    "playerId" TEXT NOT NULL,
    "relatedPlayerId" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_minutes" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "minuteOn" INTEGER NOT NULL,
    "minuteOff" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_minutes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_squads_gameId_playerId_key" ON "game_squads"("gameId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "lineup_positions_gameId_playerId_key" ON "lineup_positions"("gameId", "playerId");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_squads" ADD CONSTRAINT "game_squads_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_squads" ADD CONSTRAINT "game_squads_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formations" ADD CONSTRAINT "formations_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineup_positions" ADD CONSTRAINT "lineup_positions_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineup_positions" ADD CONSTRAINT "lineup_positions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_relatedPlayerId_fkey" FOREIGN KEY ("relatedPlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_minutes" ADD CONSTRAINT "player_minutes_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_minutes" ADD CONSTRAINT "player_minutes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
