import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
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

// Download image from URL and save locally
async function downloadAndSaveImage(url: string, teamName: string): Promise<string | null> {
  try {
    console.log(`  📥 Downloading image from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.log(`  ⚠️  Failed to download (status: ${response.status})`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads", "club-logos");
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate safe filename
    const safeName = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const extension = url.match(/\.(png|jpg|jpeg|svg|webp)(\?|$)/i)?.[1] || 'png';
    const filename = `${safeName}-logo.${extension}`;
    
    // Save file
    const filePath = join(uploadsDir, filename);
    writeFileSync(filePath, buffer);

    // Return the public URL path
    const publicUrl = `/uploads/club-logos/${filename}`;
    console.log(`  ✅ Saved locally to: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.log(`  ❌ Error downloading: ${error.message}`);
    return null;
  }
}

// Function to extract logo from Allsvenskan team page
async function extractLogoFromAllsvenskan(slug: string, teamName: string): Promise<string | null> {
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
      // Download and save it locally
      return await downloadAndSaveImage(logoUrl, teamName);
    }

    // 2. Look for Twitter card image
    const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (twitterImageMatch) {
      const logoUrl = twitterImageMatch[1];
      console.log(`  ✅ Found logo (twitter:image): ${logoUrl}`);
      // Download and save it locally
      return await downloadAndSaveImage(logoUrl, teamName);
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
        // Download and save it locally
        return await downloadAndSaveImage(logoUrl, teamName);
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
          // Download and save it locally
          return await downloadAndSaveImage(logoUrl, teamName);
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

    console.log(`Found ${teams.length} teams to import/update from Allsvenskan...\n`);
    console.log(`This script will download logos and save them locally.\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const team of teams) {
      try {
        console.log(`Processing: ${team.name}...`);
        
        // Find or create club
        let club = await prisma.club.findUnique({
          where: { name: team.name },
        });

        const isNew = !club;

        // Determine logo URL
        let logoUrl: string | null = null;
        
        // If teamUrl is a full URL, try to download and save it locally
        if (team.teamUrl.startsWith('http://') || team.teamUrl.startsWith('https://')) {
          console.log(`  📥 Attempting to download from provided URL...`);
          logoUrl = await downloadAndSaveImage(team.teamUrl, team.name);
          
          // If download failed, try Allsvenskan scraping as fallback
          if (!logoUrl) {
            console.log(`  🔄 Download failed, trying Allsvenskan scraping...`);
            // Try to extract slug from team name
            const slug = team.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            logoUrl = await extractLogoFromAllsvenskan(slug, team.name);
          }
        } else {
          // Otherwise, it's a slug - try to extract from Allsvenskan
          console.log(`  🔍 Extracting logo from Allsvenskan (slug: ${team.teamUrl})...`);
          logoUrl = await extractLogoFromAllsvenskan(team.teamUrl, team.name);
        }

        // Create or update club
        if (isNew) {
          club = await prisma.club.create({
            data: {
              name: team.name,
              logoUrl: logoUrl || null,
            },
          });
          console.log(`  ✅ Created: ${team.name}${logoUrl ? ` with logo` : ' (no logo)'}\n`);
          created++;
        } else if (logoUrl && club && club.logoUrl !== logoUrl) {
          // Update existing club with new logo
          club = await prisma.club.update({
            where: { id: club.id },
            data: { logoUrl },
          });
          console.log(`  ✅ Updated: ${team.name} with new logo: ${logoUrl}\n`);
          updated++;
        } else {
          console.log(`  ⏭️  Skipped: ${team.name} (already exists${club && club.logoUrl ? ' with logo' : ''})\n`);
          skipped++;
        }
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
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log(`\n📁 Logos saved to: public/uploads/club-logos/`);
  } catch (error: any) {
    console.error("Import failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

importClubs();
