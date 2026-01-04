import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: true,
        players: {
          include: {
            stats: {
              include: {
                match: true,
              },
            },
          },
        },
        matches: {
          include: {
            stats: {
              include: {
                player: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error: any) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch team" },
      { status: 500 }
    );
  }
}

