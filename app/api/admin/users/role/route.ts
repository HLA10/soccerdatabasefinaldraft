import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUserId, role } = await req.json();

  const updated = await prisma.user.update({
    where: { clerkId: targetUserId },
    data: { role },
  });

  return NextResponse.json(updated);
}
