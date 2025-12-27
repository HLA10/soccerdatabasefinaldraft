import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteId } = await req.json();

  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  // Update invite status
  await prisma.invite.update({
    where: { id: inviteId },
    data: { status: "ACCEPTED" },
  });

  // Add user to team
  await prisma.team.update({
    where: { id: invite.teamId },
    data: {
      members: {
        connect: { id: userId },
      },
    },
  });

  return NextResponse.json({ success: true });
}

