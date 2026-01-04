-- CreateEnum
CREATE TYPE "InjuryStatus" AS ENUM ('FIT', 'QUESTIONABLE', 'INJURED', 'RECOVERING');

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "injuryStatus" "InjuryStatus" DEFAULT 'FIT',
ADD COLUMN     "profileImageUrl" TEXT;
