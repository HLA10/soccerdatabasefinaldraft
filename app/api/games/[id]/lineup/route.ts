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
    const { formationName, formationType, positions } = await request.json();

    // Delete existing formation and lineup positions
    await prisma.lineupPosition.deleteMany({ where: { gameId } });
    await prisma.formation.deleteMany({ where: { gameId } });

    // Create new formation
    const formation = await prisma.formation.create({
      data: {
        gameId,
        formationName,
        formationType,
      },
    });

    // Create lineup positions
    if (Array.isArray(positions)) {
      await Promise.all(
        positions.map((pos: { playerId: string; positionCode: string; x?: number; y?: number }) =>
          prisma.lineupPosition.create({
            data: {
              gameId,
              playerId: pos.playerId,
              positionCode: pos.positionCode,
              x: pos.x || null,
              y: pos.y || null,
            },
          })
        )
      );
    }

    // Update squad status for starting players
    if (Array.isArray(positions)) {
      const startingPlayerIds = positions.map((p: { playerId: string }) => p.playerId);
      
      // Set all squad members to bench first
      await prisma.gameSquad.updateMany({
        where: { gameId },
        data: { status: "BENCH" },
      });

      // Set starting players
      await prisma.gameSquad.updateMany({
        where: {
          gameId,
          playerId: { in: startingPlayerIds },
        },
        data: { status: "STARTING" },
      });
    }

    const updatedGame = await prisma.match.findUnique({
      where: { id: gameId },
      include: {
        formations: true,
        lineupPositions: {
          include: {
            player: true,
          },
        },
        squad: {
          include: {
            player: true,
          },
        },
      },
    });

    return NextResponse.json(updatedGame);
  } catch (error: any) {
    console.error("Error setting lineup:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set lineup" },
      { status: 500 }
    );
  }
}


