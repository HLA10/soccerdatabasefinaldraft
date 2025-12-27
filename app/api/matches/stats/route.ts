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

  if (!user || (user.role !== "ADMIN" && user.role !== "COACH")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { playerId, matchId, goals, assists, minutes, rating } =
    await req.json();

  if (!playerId || !matchId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const stat = await prisma.playerMatchStats.create({
    data: {
      playerId,
      matchId,
      goals: goals || 0,
      assists: assists || 0,
      minutes: minutes || 0,
      rating: rating || null,
    },
  });

  return NextResponse.json(stat);
}

