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

    // Check if club with this name already exists
    const existingClub = await prisma.club.findUnique({
      where: { name: name.trim() },
      include: {
        teams: true,
      },
    });

    let club;
    if (existingClub) {
      // Club already exists, use it
      club = existingClub;
    } else {
      // Create new club
      club = await prisma.club.create({
        data: {
          name: name.trim(),
          logoUrl: logoUrl || null,
        },
        include: {
          teams: true,
        },
      });
    }

    // If teamName is provided, check if team already exists for this club
    if (teamName) {
      const existingTeam = await prisma.team.findFirst({
        where: {
          name: teamName.trim(),
          clubId: club.id,
        },
      });

      if (!existingTeam) {
        await prisma.team.create({
          data: {
            name: teamName.trim(),
            clubId: club.id,
            logoUrl: logoUrl || null, // Use club logo as default
          },
        });
      }
    }

    // Refresh club data to include any newly created team
    const updatedClub = await prisma.club.findUnique({
      where: { id: club.id },
      include: {
        teams: true,
      },
    });

    return NextResponse.json(updatedClub || club);
  } catch (error: any) {
    console.error("Error creating club:", error);
    
    // Handle unique constraint error specifically
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      return NextResponse.json(
        { error: "A club with this name already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to create club" },
      { status: 500 }
    );
  }
}


