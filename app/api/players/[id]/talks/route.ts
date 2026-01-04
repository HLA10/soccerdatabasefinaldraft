import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const talks = await prisma.developmentTalk.findMany({
      where: { playerId: id },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(talks);
  } catch (error: any) {
    console.error("Error fetching development talks:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch development talks" },
      { status: 500 }
    );
  }
}

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
    const data = await request.json();

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const talk = await prisma.developmentTalk.create({
      data: {
        playerId: id,
        coachId: user.id,
        category: data.category,
        notes: data.notes,
        goals: data.goals || null,
        actionPoints: data.actionPoints || null,
        attachments: data.attachments || [],
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(talk);
  } catch (error: any) {
    console.error("Error creating development talk:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create development talk" },
      { status: 500 }
    );
  }
}

