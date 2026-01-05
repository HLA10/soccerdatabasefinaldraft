import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const games = await prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        team: true,
        squad: {
          include: {
            player: true,
          },
        },
        formations: true,
        lineupPositions: {
          include: {
            player: true,
          },
        },
        events: {
          include: {
            player: true,
            relatedPlayer: true,
            team: true,
          },
          orderBy: {
            minute: "asc",
          },
        },
        playerMinutes: {
          include: {
            player: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(games);
  } catch (error: any) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch games" },
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
    const { homeTeamId, awayTeamId, date, time, venue, formationType } = await req.json();

    if (!homeTeamId || !awayTeamId || !date) {
      return NextResponse.json(
        { error: "Home team, away team, and date are required" },
        { status: 400 }
      );
    }

    // Combine date and time if provided
    let matchDateTime = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(":");
      matchDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    const game = await prisma.match.create({
      data: {
        date: matchDateTime,
        time: time ? matchDateTime : null,
        venue: venue || null,
        homeTeamId,
        awayTeamId,
        teamId: homeTeamId, // Keep for backward compatibility
        opponent: "", // Will be set from awayTeam name
        formationType: formationType || "ELEVEN_V_ELEVEN",
        scoreHome: 0,
        scoreAway: 0,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    // Update opponent field with away team name for backward compatibility
    if (game.awayTeam) {
      await prisma.match.update({
        where: { id: game.id },
        data: { opponent: game.awayTeam.name },
      });
    }

    return NextResponse.json(game);
  } catch (error: any) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create game" },
      { status: 500 }
    );
  }
}
