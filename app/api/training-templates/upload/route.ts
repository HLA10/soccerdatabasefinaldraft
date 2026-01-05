import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const daysOfWeek = formData.get("daysOfWeek") ? JSON.parse(formData.get("daysOfWeek") as string) : [];
    const playerIds = formData.get("playerIds") ? JSON.parse(formData.get("playerIds") as string) : [];

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
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

    const fileName = file.name.toLowerCase();
    let parsedData: any = null;

    // Parse based on file type
    if (fileName.endsWith(".csv")) {
      // Parse CSV
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      
      if (lines.length < 2) {
        return NextResponse.json(
          { error: "CSV file must have headers and at least one data row" },
          { status: 400 }
        );
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const partNameIndex = headers.findIndex((h) => h.includes("part") || h.includes("name"));
      const categoryIndex = headers.findIndex((h) => h.includes("category"));
      const durationIndex = headers.findIndex((h) => h.includes("duration") || h.includes("min"));
      const notesIndex = headers.findIndex((h) => h.includes("note"));
      const playersIndex = headers.findIndex((h) => h.includes("player"));

      const parts: any[] = [];
      const allPlayers: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        
        if (values[partNameIndex]) {
          parts.push({
            name: values[partNameIndex] || "",
            category: values[categoryIndex] || "OTHER",
            duration: parseInt(values[durationIndex]) || 15,
            notes: values[notesIndex] || null,
          });

          // Extract players if present
          if (playersIndex >= 0 && values[playersIndex]) {
            const playersInRow = values[playersIndex].split(";").map((p) => p.trim());
            allPlayers.push(...playersInRow);
          }
        }
      }

      parsedData = {
        name: file.name.replace(/\.(csv|pdf)$/i, ""),
        parts,
        playerNames: [...new Set(allPlayers)], // Unique player names
      };
    } else if (fileName.endsWith(".pdf")) {
      // For PDF, we'll need a PDF parsing library
      // For now, return a basic structure - in production, use pdf-parse or similar
      const buffer = await file.arrayBuffer();
      
      // Basic parsing - in production, use a proper PDF library
      // For now, create a placeholder template
      parsedData = {
        name: file.name.replace(/\.pdf$/i, ""),
        parts: [
          {
            name: "Warm Up",
            category: "WARM_UP",
            duration: 10,
            notes: "Uploaded from PDF - please edit",
          },
          {
            name: "Main Session",
            category: "TECHNICAL",
            duration: 60,
            notes: "Uploaded from PDF - please edit",
          },
          {
            name: "Cool Down",
            category: "COOL_DOWN",
            duration: 10,
            notes: "Uploaded from PDF - please edit",
          },
        ],
        playerNames: [],
      };

      // Note: In production, implement proper PDF parsing using a library like pdf-parse
      // const pdfParse = require('pdf-parse');
      // const pdfData = await pdfParse(buffer);
      // Parse pdfData.text to extract structure
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload CSV or PDF" },
        { status: 400 }
      );
    }

    // Match player names to IDs if provided
    const matchedPlayerIds: string[] = [];
    if (parsedData.playerNames && parsedData.playerNames.length > 0) {
      const players = await prisma.player.findMany({
        where: {
          OR: parsedData.playerNames.map((name: string) => ({
            OR: [
              { firstName: { contains: name, mode: "insensitive" } },
              { lastName: { contains: name, mode: "insensitive" } },
            ],
          })),
        },
      });
      matchedPlayerIds.push(...players.map((p) => p.id));
    }

    // Combine with provided player IDs
    const finalPlayerIds = [...new Set([...matchedPlayerIds, ...playerIds])];

    // Create template
    const template = await prisma.trainingSessionTemplate.create({
      data: {
        name: parsedData.name,
        createdBy: user.id,
        daysOfWeek,
        playerIds: finalPlayerIds,
        parts: {
          create: parsedData.parts.map((part: any, index: number) => {
            // Map category to valid enum value
            const categoryMap: Record<string, string> = {
              "WARM_UP": "WARM_UP",
              "WARMUP": "WARM_UP",
              "TECHNICAL": "TECHNICAL",
              "TACTICAL": "TACTICAL",
              "PHYSICAL": "PHYSICAL",
              "COOL_DOWN": "COOL_DOWN",
              "COOLDOWN": "COOL_DOWN",
              "GAME": "GAME",
              "OTHER": "OTHER",
            };
            const normalizedCategory = (part.category || "OTHER").toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z_]/g, "_");
            const validCategory = categoryMap[normalizedCategory] || "OTHER";
            
            return {
              name: part.name,
              category: validCategory as any,
              duration: part.duration || 15,
              notes: part.notes || null,
              orderIndex: index,
            };
          }),
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
    console.error("Error uploading template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload template" },
      { status: 500 }
    );
  }
}

