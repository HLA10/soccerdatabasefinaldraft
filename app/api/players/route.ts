import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: {
        team: true,
        stats: {
          include: {
            match: true,
          },
        },
      },
      orderBy: {
        lastName: "asc",
      },
    });

    return NextResponse.json(players);
  } catch (error: any) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch players" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  const player = await prisma.player.create({
    data,
    include: {
      team: true,
    },
  });

  return NextResponse.json(player);
}


