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
    const { id } = await params;
    const { formationName, formationType, lineup } = await request.json();

    if (!formationName || !formationType) {
      return NextResponse.json(
        { error: "formationName and formationType are required" },
        { status: 400 }
      );
    }

    // Create formation
    const formation = await prisma.formation.create({
      data: {
        gameId: id,
        formationName,
        formationType,
      },
    });

    // Update game formation type
    await prisma.match.update({
      where: { id },
      data: {
        formationType,
      },
    });

    // Delete existing lineup positions
    await prisma.lineupPosition.deleteMany({
      where: { gameId: id },
    });

    // Create lineup positions if provided
    if (lineup && Array.isArray(lineup)) {
      await prisma.lineupPosition.createMany({
        data: lineup.map((pos: any) => ({
          gameId: id,
          playerId: pos.playerId,
          positionCode: pos.positionCode,
          x: pos.x || null,
          y: pos.y || null,
        })),
      });
    }

    // Return formation with lineup
    const result = await prisma.formation.findUnique({
      where: { id: formation.id },
      include: {
        game: {
          include: {
            lineupPositions: {
              include: {
                player: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating formation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create formation" },
      { status: 500 }
    );
  }
}

