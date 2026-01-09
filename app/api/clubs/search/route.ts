import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Search clubs and teams
    const clubs = await prisma.club.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        teams: true,
      },
      take: 10,
    });

    const teams = await prisma.team.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        club: true,
      },
      take: 10,
    });

    // Combine results
    const results = [
      ...clubs.map((club) => ({
        id: club.id,
        name: club.name,
        type: "club" as const,
        logoUrl: club.logoUrl,
        teams: club.teams,
      })),
      ...teams.map((team) => ({
        id: team.id,
        name: team.name,
        type: "team" as const,
        logoUrl: team.logoUrl || team.club?.logoUrl || null,
        club: team.club,
      })),
    ];

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error searching clubs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search" },
      { status: 500 }
    );
  }
}


