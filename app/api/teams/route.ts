import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user from Prisma
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only ADMIN or COACH can create teams
  if (user.role !== "ADMIN" && user.role !== "COACH") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Team name required" }, { status: 400 });
  }

  // Create the team
  const team = await prisma.team.create({
    data: {
      name,
      members: {
        connect: { id: userId }, // creator becomes a member
      },
    },
  });

  return NextResponse.json(team);
}

