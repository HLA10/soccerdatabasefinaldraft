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
    const { playerIds } = await request.json();

    if (!Array.isArray(playerIds)) {
      return NextResponse.json(
        { error: "playerIds must be an array" },
        { status: 400 }
      );
    }

    // Delete existing squad entries for this game
    await prisma.gameSquad.deleteMany({
      where: { gameId },
    });

    // Create new squad entries
    const squad = await Promise.all(
      playerIds.map((playerId: string) =>
        prisma.gameSquad.create({
          data: {
            gameId,
            playerId,
            status: "CALLED",
          },
          include: {
            player: true,
          },
        })
      )
    );

    return NextResponse.json(squad);
  } catch (error: any) {
    console.error("Error updating squad:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update squad" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: gameId } = await params;
    const { playerId, status } = await request.json();

    if (!playerId || !status) {
      return NextResponse.json(
        { error: "playerId and status are required" },
        { status: 400 }
      );
    }

    const squad = await prisma.gameSquad.update({
      where: {
        gameId_playerId: {
          gameId,
          playerId,
        },
      },
      data: {
        status,
      },
      include: {
        player: true,
      },
    });

    return NextResponse.json(squad);
  } catch (error: any) {
    console.error("Error updating squad status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update squad status" },
      { status: 500 }
    );
  }
}
