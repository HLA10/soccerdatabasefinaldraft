import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error: any) {
    console.error("Error creating team:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A team with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create team" },
      { status: 500 }
    );
  }
}
