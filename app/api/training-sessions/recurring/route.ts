import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      teamId,
      name,
      daysOfWeek,
      startDate,
      endDate,
      time,
      location,
      templateId,
      parts,
    } = await req.json();

    if (!teamId || !name || !startDate || !daysOfWeek || daysOfWeek.length === 0) {
      return NextResponse.json(
        { error: "Team, name, start date, and at least one day are required" },
        { status: 400 }
      );
    }

    // Parse dates
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    // Generate all session dates based on days of week
    const sessionDates: Date[] = [];
    const currentDate = new Date(start);
    
    while (!end || currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      if (daysOfWeek.includes(dayOfWeek)) {
        // Create a new date for this session
        const sessionDate = new Date(currentDate);
        if (time) {
          const [hours, minutes] = time.split(":");
          sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        sessionDates.push(sessionDate);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Safety limit: don't generate more than 500 sessions
      if (sessionDates.length >= 500) {
        break;
      }
    }

    // Create recurring schedule
    const schedule = await prisma.recurringTrainingSchedule.create({
      data: {
        teamId,
        name,
        daysOfWeek,
        startDate: start,
        endDate: end,
        time: time || null,
        location: location || null,
        templateId: templateId || null,
      },
    });

    // Create all sessions
    const sessions = await Promise.all(
      sessionDates.map((sessionDate) => {
        const sessionData: any = {
          teamId,
          name,
          date: sessionDate,
          time: time ? sessionDate : null,
          location: location || null,
          templateId: templateId || null,
          recurringScheduleId: schedule.id,
          parts: parts && parts.length > 0 ? {
            create: parts.map((part: any, index: number) => ({
              name: part.name,
              category: part.category,
              duration: part.duration,
              notes: part.notes || null,
              orderIndex: index,
            })),
          } : undefined,
        };

        return prisma.trainingSession.create({
          data: sessionData,
          include: {
            parts: true,
            team: true,
          },
        });
      })
    );

    return NextResponse.json({
      schedule,
      sessions,
      count: sessions.length,
    });
  } catch (error: any) {
    console.error("Error creating recurring sessions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create recurring sessions" },
      { status: 500 }
    );
  }
}

