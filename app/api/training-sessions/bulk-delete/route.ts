import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionIds, recurringScheduleId } = await req.json();

    if (recurringScheduleId) {
      // Delete all sessions from a recurring schedule
      const sessions = await prisma.trainingSession.findMany({
        where: { recurringScheduleId },
      });

      const sessionIdsToDelete = sessions.map((s) => s.id);

      // Delete all parts for these sessions
      await prisma.trainingSessionPart.deleteMany({
        where: { sessionId: { in: sessionIdsToDelete } },
      });

      // Delete all sessions
      await prisma.trainingSession.deleteMany({
        where: { recurringScheduleId },
      });

      // Delete the recurring schedule
      await prisma.recurringTrainingSchedule.delete({
        where: { id: recurringScheduleId },
      });

      return NextResponse.json({
        success: true,
        message: `Deleted ${sessionIdsToDelete.length} training sessions from recurring schedule`,
        count: sessionIdsToDelete.length,
      });
    }

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: "sessionIds array is required" },
        { status: 400 }
      );
    }

    // Delete parts for selected sessions
    await prisma.trainingSessionPart.deleteMany({
      where: { sessionId: { in: sessionIds } },
    });

    // Delete the sessions
    const result = await prisma.trainingSession.deleteMany({
      where: { id: { in: sessionIds } },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} training session(s)`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("Error bulk deleting training sessions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete training sessions" },
      { status: 500 }
    );
  }
}


