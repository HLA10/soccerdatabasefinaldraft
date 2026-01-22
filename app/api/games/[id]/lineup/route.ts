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

    // Create lineup positions - filter out duplicates and empty playerIds
    let uniquePositions: Array<{ playerId: string; positionCode: string; x?: number; y?: number }> = [];
    
    if (Array.isArray(positions)) {
      // Filter out empty playerIds and deduplicate by playerId
      const seenPlayerIds = new Set<string>();
      uniquePositions = positions
        .filter((pos: { playerId: string; positionCode: string; x?: number; y?: number }) => {
          // Skip if playerId is empty or already seen
          if (!pos.playerId || pos.playerId.trim() === "" || seenPlayerIds.has(pos.playerId)) {
            return false;
          }
          seenPlayerIds.add(pos.playerId);
          return true;
        });

      if (uniquePositions.length > 0) {
        await Promise.all(
          uniquePositions.map((pos: { playerId: string; positionCode: string; x?: number; y?: number }) =>
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
    }

    // Update squad status for starting players (use deduplicated positions)
    if (uniquePositions.length > 0) {
      const startingPlayerIds = uniquePositions.map((p) => p.playerId);
      
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


