import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: gameId } = await params;
    const { minute, type, playerId, relatedPlayerId, teamId } = await request.json();

    if (!minute || !type || !playerId || !teamId) {
      return NextResponse.json(
        { error: "minute, type, playerId, and teamId are required" },
        { status: 400 }
      );
    }

    // Create the event
    const event = await prisma.matchEvent.create({
      data: {
        gameId,
        minute: parseInt(minute),
        type,
        playerId,
        relatedPlayerId: relatedPlayerId || null,
        teamId,
      },
      include: {
        player: true,
        relatedPlayer: true,
        team: true,
      },
    });

    // Update game score if it's a goal
    if (type === "GOAL") {
      const game = await prisma.match.findUnique({
        where: { id: gameId },
      });

      if (game) {
        const isHomeTeam = game.homeTeamId === teamId;
        await prisma.match.update({
          where: { id: gameId },
          data: {
            scoreHome: isHomeTeam ? game.scoreHome + 1 : game.scoreHome,
            scoreAway: !isHomeTeam ? game.scoreAway + 1 : game.scoreAway,
          },
        });
      }
    }

    // Handle substitutions and update PlayerMinutes
    if (type === "SUB_ON" && relatedPlayerId) {
      // Player coming on - create or update PlayerMinutes
      const existingMinutes = await prisma.playerMinutes.findFirst({
        where: {
          gameId,
          playerId,
          minuteOff: null, // Still on the field
        },
      });

      if (!existingMinutes) {
        await prisma.playerMinutes.create({
          data: {
            gameId,
            playerId,
            minuteOn: parseInt(minute),
            minuteOff: null,
          },
        });
      }

      // Player going off - update their PlayerMinutes
      await prisma.playerMinutes.updateMany({
        where: {
          gameId,
          playerId: relatedPlayerId,
          minuteOff: null,
        },
        data: {
          minuteOff: parseInt(minute),
        },
      });
    } else if (type === "SUB_OFF") {
      // Update PlayerMinutes for player going off
      await prisma.playerMinutes.updateMany({
        where: {
          gameId,
          playerId,
          minuteOff: null,
        },
        data: {
          minuteOff: parseInt(minute),
        },
      });
    }

    // For starting players, create initial PlayerMinutes entry if they started
    if (parseInt(minute) === 0) {
      const isStarting = await prisma.gameSquad.findFirst({
        where: {
          gameId,
          playerId,
          status: "STARTING",
        },
      });

      if (isStarting) {
        const existing = await prisma.playerMinutes.findFirst({
          where: {
            gameId,
            playerId,
            minuteOn: 0,
          },
        });

        if (!existing) {
          await prisma.playerMinutes.create({
            data: {
              gameId,
              playerId,
              minuteOn: 0,
              minuteOff: null,
            },
          });
        }
      }
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;

    const events = await prisma.matchEvent.findMany({
      where: { gameId },
      include: {
        player: true,
        relatedPlayer: true,
        team: true,
      },
      orderBy: {
        minute: "asc",
      },
    });    return NextResponse.json(events);
  } catch (error: any) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch events" },
      { status: 500 }
    );
  }
}