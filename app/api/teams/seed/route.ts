import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const teamNames = ["F2011-A", "F2012-A", "F2013-A"];
    const createdTeams = [];

    for (const teamName of teamNames) {
      // Check if team already exists
      const existing = await prisma.team.findFirst({
        where: { name: teamName },
      });

      if (existing) {
        createdTeams.push({ name: teamName, status: "already exists", id: existing.id });
        continue;
      }

      // Create the team
      const team = await prisma.team.create({
        data: {
          name: teamName,
        },
      });

      createdTeams.push({ name: team.name, status: "created", id: team.id });
    }

    return NextResponse.json({
      success: true,
      message: "Teams processed",
      teams: createdTeams,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create teams" },
      { status: 500 }
    );
  }
}


