import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const games = await prisma.match.findMany({
      include: {
        homeTeam: {
          include: {
            club: true,
          },
        },
        awayTeam: {
          include: {
            club: true,
          },
        },
        team: {
          include: {
            club: true,
          },
        },
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
        const {
          homeTeamId,
          awayTeamId,
          date,
          time,
          venue,
          venueName,
          formationType,
          matchType,
          opponentName,
          opponentLogoUrl,
          tournamentId,
        } = await req.json();

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

    // Get away team for opponent name/logo if not provided
    const awayTeam = await prisma.team.findUnique({
      where: { id: awayTeamId },
      include: {
        club: true,
      },
    });

    const game = await prisma.match.create({
      data: {
        date: matchDateTime,
        time: time ? matchDateTime : null,
        venue: venue || null,
        venueName: venueName || null,
        homeTeamId,
        awayTeamId,
        teamId: homeTeamId, // Keep for backward compatibility
        opponent: opponentName || awayTeam?.name || "", // Set opponent name
        opponentName: opponentName || awayTeam?.name || null,
        opponentLogoUrl: opponentLogoUrl || awayTeam?.club?.logoUrl || awayTeam?.logoUrl || null,
        matchType: matchType || "FRIENDLY",
        tournamentId: tournamentId || null,
        formationType: formationType || "ELEVEN_V_ELEVEN",
        scoreHome: 0,
        scoreAway: 0,
      },
      include: {
        homeTeam: {
          include: {
            club: true,
          },
        },
        awayTeam: {
          include: {
            club: true,
          },
        },
      },
    });

    return NextResponse.json(game);
  } catch (error: any) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create game" },
      { status: 500 }
    );
  }
}
