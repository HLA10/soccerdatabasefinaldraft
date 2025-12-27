import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteId } = await req.json();

  const invite = await prisma.invite.update({
    where: { id: inviteId },
    data: { accepted: true, receiverId: userId },
  });

  return NextResponse.json(invite);
}
