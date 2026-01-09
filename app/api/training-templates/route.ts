import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.trainingSessionTemplate.findMany({
      include: {
        parts: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, parts } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const template = await prisma.trainingSessionTemplate.create({
      data: {
        name,
        createdBy: user.id,
        parts: {
          create: parts.map((part: any, index: number) => ({
            name: part.name,
            category: part.category,
            duration: part.duration,
            notes: part.notes || null,
            orderIndex: index,
          })),
        },
      },
      include: {
        parts: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create template" },
      { status: 500 }
    );
  }
}


