import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: {
        team: true,
        stats: {
          include: {
            match: true,
          },
        },
      },
      orderBy: {
        lastName: "asc",
      },
    });

    return NextResponse.json(players);
  } catch (error: any) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch players" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.position) {
      return NextResponse.json(
        { error: "First name, last name, and position are required" },
        { status: 400 }
      );
    }

    // Validate position enum
    const validPositions = ["GK", "DF", "MF", "FW"];
    if (!validPositions.includes(data.position)) {
      return NextResponse.json(
        { error: "Invalid position. Must be one of: GK, DF, MF, FW" },
        { status: 400 }
      );
    }

    // Validate injuryStatus if provided
    if (data.injuryStatus) {
      const validInjuryStatuses = ["FIT", "QUESTIONABLE", "INJURED", "RECOVERING"];
      if (!validInjuryStatuses.includes(data.injuryStatus)) {
        return NextResponse.json(
          { error: "Invalid injury status" },
          { status: 400 }
        );
      }
    }

    // Handle dateOfBirth - convert empty string to null
    let dateOfBirth = null;
    if (data.dateOfBirth && data.dateOfBirth.trim() !== "") {
      try {
        dateOfBirth = new Date(data.dateOfBirth);
        // Validate the date
        if (isNaN(dateOfBirth.getTime())) {
          return NextResponse.json(
            { error: "Invalid date of birth format" },
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid date of birth format" },
          { status: 400 }
        );
      }
    }

    const player = await prisma.player.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        dateOfBirth: dateOfBirth,
        position: data.position,
        teamId: data.teamId && data.teamId.trim() !== "" ? data.teamId : null,
        profileImageUrl: data.profileImageUrl && data.profileImageUrl.trim() !== "" ? data.profileImageUrl : null,
        injuryStatus: data.injuryStatus || "FIT",
        jerseyNumber: data.jerseyNumber || null,
        contractStatus: data.contractStatus !== undefined ? data.contractStatus : true,
      },
      include: {
        team: true,
      },
    });

    return NextResponse.json(player);
  } catch (error: any) {
    console.error("Error creating player:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create player" },
      { status: 500 }
    );
  }
}


