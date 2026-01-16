import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const game = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        team: true,
        squad: {
          include: {
            player: {
              include: {
                team: true,
              },
            },
          },
          orderBy: {
            status: "asc",
          },
        },
        formations: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
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
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error: any) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch game" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const game = await prisma.match.update({
      where: { id },
      data,
      include: {
        homeTeam: true,
        awayTeam: true,
        squad: {
          include: {
            player: true,
          },
        },
        events: {
          include: {
            player: true,
            relatedPlayer: true,
          },
          orderBy: {
            minute: "asc",
          },
        },
      },
    });

    return NextResponse.json(game);
  } catch (error: any) {
    console.error("Error updating game:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update game" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete related records first (cascading should handle most, but being explicit)
    await prisma.matchEvent.deleteMany({
      where: { gameId: id },
    });    await prisma.playerMinutes.deleteMany({
      where: { gameId: id },
    });

    await prisma.lineupPosition.deleteMany({
      where: { gameId: id },
    });

    await prisma.formation.deleteMany({
      where: { gameId: id },
    });

    await prisma.gameSquad.deleteMany({
      where: { gameId: id },
    });

    // Delete the match
    await prisma.match.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Game deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting game:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete game" },
      { status: 500 }
    );
  }
}