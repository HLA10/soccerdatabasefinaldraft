import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        team: true,
        stats: {
          include: {
            match: true,
          },
          orderBy: {
            match: {
              date: "desc",
            },
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error: any) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch player" },
      { status: 500 }
    );
  }
}

