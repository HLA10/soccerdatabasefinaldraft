import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL environment variable is not set!");
  console.error("Please make sure your .env file contains DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error"],
});

interface TeamData {
  name: string;
  teamUrl: string; // Can be a full URL or a slug
}

// Function to extract logo from Allsvenskan team page
async function extractLogoFromAllsvenskan(slug: string): Promise<string | null> {
  const teamUrl = `https://allsvenskan.se/lagen/${slug}`;
  
  try {
    console.log(`  🔍 Fetching ${teamUrl}...`);
    
    const response = await fetch(teamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      console.log(`  ⚠️  Could not fetch page (status: ${response.status})`);
      return null;
    }

    const html = await response.text();
    
    // Try multiple methods to find the logo:
    
    // 1. Look for Open Graph image
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      const logoUrl = ogImageMatch[1];
      console.log(`  ✅ Found logo (og:image): ${logoUrl}`);
      return logoUrl;
    }

    // 2. Look for Twitter card image
    const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (twitterImageMatch) {
      const logoUrl = twitterImageMatch[1];
      console.log(`  ✅ Found logo (twitter:image): ${logoUrl}`);
      return logoUrl;
    }

    // 3. Look for img tags with team logo
    const logoImgPatterns = [
      /<img[^>]*class=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
      /<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*logo[^"']*["']/i,
      /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
    ];

    for (const pattern of logoImgPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const logoUrl = match[1].startsWith('http') 
          ? match[1] 
          : new URL(match[1], 'https://allsvenskan.se').href;
        console.log(`  ✅ Found logo (img tag): ${logoUrl}`);
        return logoUrl;
      }
    }

    // 4. Try common Allsvenskan logo paths
    const commonPaths = [
      `https://allsvenskan.se/images/teams/${slug}.png`,
      `https://allsvenskan.se/images/teams/${slug}.svg`,
      `https://allsvenskan.se/images/logos/${slug}.png`,
      `https://allsvenskan.se/static/images/teams/${slug}.png`,
    ];

    for (const logoUrl of commonPaths) {
      try {
        const testResponse = await fetch(logoUrl, { method: 'HEAD' });
        if (testResponse.ok) {
          console.log(`  ✅ Found logo (common path): ${logoUrl}`);
          return logoUrl;
        }
      } catch {
        // Continue to next path
      }
    }

    console.log(`  ⚠️  Could not find logo on page`);
    return null;
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

// Simple CSV parser that handles quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function importClubs() {
  try {
    // Read CSV file
    const csvPath = join(process.cwd(), "scripts", "allsvenskan-teams.csv");
    const csvContent = readFileSync(csvPath, "utf-8");
    
    // Parse CSV
    const lines = csvContent.split("\n").filter(line => line.trim());
    const teams: TeamData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 2 && values[0] && values[1]) {
        teams.push({
          name: values[0],
          teamUrl: values[1],
        });
      }
    }

    console.log(`Found ${teams.length} teams to import from Allsvenskan...\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const team of teams) {
      try {
        console.log(`Processing: ${team.name}...`);
        
        // Check if club already exists
        const existing = await prisma.club.findUnique({
          where: { name: team.name },
        });

        if (existing) {
          console.log(`  ⏭️  Skipped: ${team.name} (already exists)\n`);
          skipped++;
          continue;
        }

        // Determine logo URL
        let logoUrl: string | null = null;
        
        // If teamUrl is a full URL, use it directly
        if (team.teamUrl.startsWith('http://') || team.teamUrl.startsWith('https://')) {
          logoUrl = team.teamUrl;
          console.log(`  ✅ Using provided logo URL: ${logoUrl}`);
        } else {
          // Otherwise, it's a slug - try to extract from Allsvenskan
          console.log(`  🔍 Extracting logo from Allsvenskan (slug: ${team.teamUrl})...`);
          logoUrl = await extractLogoFromAllsvenskan(team.teamUrl);
        }

        // Create club
        await prisma.club.create({
          data: {
            name: team.name,
            logoUrl: logoUrl || null,
          },
        });

        console.log(`  ✅ Created: ${team.name}${logoUrl ? ` with logo` : ' (no logo)'}\n`);
        created++;
      } catch (error: any) {
        if (error.code === "P2002") {
          console.log(`  ⏭️  Skipped: ${team.name} (already exists)\n`);
          skipped++;
        } else {
          console.error(`  ❌ Error: ${error.message}\n`);
          errors++;
        }
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
  } catch (error: any) {
    console.error("Import failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

importClubs();
