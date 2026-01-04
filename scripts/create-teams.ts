import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["query"],
});

async function main() {
  console.log("Creating teams...");

  const teamNames = ["F2011-A", "F2012-A"];

  for (const teamName of teamNames) {
    try {
      // Check if team already exists
      const existing = await prisma.team.findFirst({
        where: { name: teamName },
      });

      if (existing) {
        console.log(`Team "${teamName}" already exists. Skipping...`);
        continue;
      }

      // Create the team
      const team = await prisma.team.create({
        data: {
          name: teamName,
        },
      });

      console.log(`✓ Created team: ${team.name} (ID: ${team.id})`);
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(`Team "${teamName}" already exists. Skipping...`);
      } else {
        console.error(`Error creating team "${teamName}":`, error.message);
      }
    }
  }

  console.log("\nTeams creation completed!");
}

main()
  .catch((e) => {
    console.error("Error creating teams:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

