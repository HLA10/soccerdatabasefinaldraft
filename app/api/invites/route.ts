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

  const { email, teamId } = await req.json();

  if (!email || !teamId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const invite = await prisma.invite.create({
    data: {
      email,
      teamId,
      invitedBy: userId,
      status: "PENDING",
    },
  });

  return NextResponse.json(invite);
}

