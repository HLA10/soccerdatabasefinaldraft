-- AlterTable
ALTER TABLE "training_session_templates" ADD COLUMN     "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "playerIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "training_sessions" ADD COLUMN     "recurringScheduleId" TEXT;

-- CreateTable
CREATE TABLE "recurring_training_schedules" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "daysOfWeek" INTEGER[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "time" TEXT,
    "location" TEXT,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_training_schedules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_recurringScheduleId_fkey" FOREIGN KEY ("recurringScheduleId") REFERENCES "recurring_training_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_training_schedules" ADD CONSTRAINT "recurring_training_schedules_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_training_schedules" ADD CONSTRAINT "recurring_training_schedules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "training_session_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
