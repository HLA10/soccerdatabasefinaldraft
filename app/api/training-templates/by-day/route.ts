import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dayOfWeek = searchParams.get("day");

    const where: any = {};

    if (dayOfWeek !== null) {
      const dayNum = parseInt(dayOfWeek);
      if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
        // Find templates that include this day of week
        where.daysOfWeek = {
          has: dayNum,
        };
      }
    }

    const templates = await prisma.trainingSessionTemplate.findMany({
      where,
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
    console.error("Error fetching templates by day:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

