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
