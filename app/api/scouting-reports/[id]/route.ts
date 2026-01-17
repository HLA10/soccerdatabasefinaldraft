import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.scoutingReport.findUnique({
      where: { id },
      include: {
        club: true,
        team: {
          include: {
            club: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Scouting report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error fetching scouting report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scouting report" },
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
    const { id } = await params;
    const { playerName, clubId, teamId, ageGroup, notes, dateObserved } = await request.json();

    // Get user from database - try by clerkId first, then by id
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Fallback: try by id in case userId is the same as id
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if report exists and belongs to user
    const existingReport = await prisma.scoutingReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Scouting report not found" }, { status: 404 });
    }

    if (existingReport.createdBy !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: any = {};
    if (playerName !== undefined) updateData.playerName = playerName.trim();
    if (clubId !== undefined) updateData.clubId = clubId || null;
    if (teamId !== undefined) updateData.teamId = teamId || null;
    if (ageGroup !== undefined) updateData.ageGroup = ageGroup || null;
    if (notes !== undefined) updateData.notes = notes.trim();
    if (dateObserved !== undefined) updateData.dateObserved = new Date(dateObserved);

    const report = await prisma.scoutingReport.update({
      where: { id },
      data: updateData,
      include: {
        club: true,
        team: {
          include: {
            club: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error updating scouting report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update scouting report" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Get user from database - try by clerkId first, then by id
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Fallback: try by id in case userId is the same as id
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if report exists and belongs to user
    const existingReport = await prisma.scoutingReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Scouting report not found" }, { status: 404 });
    }

    if (existingReport.createdBy !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.scoutingReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Scouting report deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting scouting report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete scouting report" },
      { status: 500 }
    );
  }
}
