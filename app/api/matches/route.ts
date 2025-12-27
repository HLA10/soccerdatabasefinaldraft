import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "COACH")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { date, opponent, teamId } = await req.json();

  if (!date || !opponent || !teamId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const match = await prisma.match.create({
    data: {
      date: new Date(date),
      opponent,
      teamId,
    },
  });

  return NextResponse.json(match);
}

export async function GET() {
  const matches = await prisma.match.findMany({
    include: { team: true, stats: true },
  });

  return NextResponse.json(matches);
}

