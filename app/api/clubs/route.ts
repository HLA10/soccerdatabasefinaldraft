import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        teams: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(clubs);
  } catch (error: any) {
    console.error("Error fetching clubs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch clubs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, logoUrl, teamName } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Club name is required" },
        { status: 400 }
      );
    }

    // Create club
    const club = await prisma.club.create({
      data: {
        name,
        logoUrl: logoUrl || null,
      },
      include: {
        teams: true,
      },
    });

    // If teamName is provided, create a team for this club
    if (teamName) {
      await prisma.team.create({
        data: {
          name: teamName,
          clubId: club.id,
          logoUrl: logoUrl || null, // Use club logo as default
        },
      });
    }

    return NextResponse.json(club);
  } catch (error: any) {
    console.error("Error creating club:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create club" },
      { status: 500 }
    );
  }
}

