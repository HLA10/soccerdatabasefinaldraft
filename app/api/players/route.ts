import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only ADMIN or COACH can create players
  if (user.role !== "ADMIN" && user.role !== "COACH") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { firstName, lastName, position, teamId } = body;

  if (!firstName || !lastName || !position) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const player = await prisma.player.create({
    data: {
      firstName,
      lastName,
      position,
      teamId: teamId || null,
    },
  });

  return NextResponse.json(player);
}

export async function GET() {
  const players = await prisma.player.findMany({
    include: { team: true },
  });

  return NextResponse.json(players);
}

