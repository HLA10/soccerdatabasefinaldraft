import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.trainingSession.findMany({
      include: {
        team: true,
        parts: {
          orderBy: {
            orderIndex: "asc",
          },
        },
        recurringSchedule: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { teamId, name, date, time, location, templateId, parts } = await req.json();

    if (!teamId || !name || !date) {
      return NextResponse.json(
        { error: "Team, name, and date are required" },
        { status: 400 }
      );
    }

    // Combine date and time if provided
    let sessionDateTime = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(":");
      sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    const session = await prisma.trainingSession.create({
      data: {
        teamId,
        name,
        date: sessionDateTime,
        time: time ? sessionDateTime : null,
        location: location || null,
        templateId: templateId || null,
        parts: {
          create: (parts || []).map((part: any, index: number) => ({
            name: part.name,
            category: part.category,
            duration: part.duration,
            notes: part.notes || null,
            orderIndex: index,
          })),
        },
      },
      include: {
        team: true,
        parts: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });

    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}

