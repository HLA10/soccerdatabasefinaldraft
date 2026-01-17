import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database - try by clerkId first, then by id
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Fallback: try by id in case userId is the same as id
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const reports = await prisma.scoutingReport.findMany({
      where: {
        createdBy: user.id,
      },
      include: {
        club: true,
        team: {
          include: {
            club: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        dateObserved: "desc",
      },
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("Error fetching scouting reports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scouting reports" },
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
    // Get user from database - try by clerkId first, then by id
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Fallback: try by id in case userId is the same as id
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { playerName, clubId, teamId, ageGroup, notes, dateObserved } = await req.json();

    if (!playerName || !notes || !dateObserved) {
      return NextResponse.json(
        { error: "Player name, notes, and date observed are required" },
        { status: 400 }
      );
    }

    const report = await prisma.scoutingReport.create({
      data: {
        playerName: playerName.trim(),
        clubId: clubId || null,
        teamId: teamId || null,
        ageGroup: ageGroup || null,
        notes: notes.trim(),
        dateObserved: new Date(dateObserved),
        createdBy: user.id,
      },
      include: {
        club: true,
        team: {
          include: {
            club: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error creating scouting report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create scouting report" },
      { status: 500 }
    );
  }
}
