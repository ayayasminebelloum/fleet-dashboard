import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://atvqkntixckpyspxvgca.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dnFrbnRpeGNrcHlzcHh2Z2NhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgyNjYzOCwiZXhwIjoyMDgwNDAyNjM4fQ.iu4qf8O8dwwB4CP52yavmV0-jEmNe4Xy-_EU1ZgZU6c";

function normalizeHealth(x: number | null) {
  if (x == null) return 0;
  // handle both 0–1 and 0–100
  return x > 1 ? x / 100 : x;
}

export async function GET() {
  console.log("🚀 Starting vessels API call...");
  
  try {
    // Fetch vessels from Supabase REST API
    console.log("📡 Fetching vessels from Supabase REST API...");
    const vesselsResponse = await fetch(`${SUPABASE_URL}/rest/v1/vessels?select=vessel_id,vessel_name,latitude,longitude&order=vessel_name`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!vesselsResponse.ok) {
      throw new Error(`Vessels fetch failed: ${vesselsResponse.status}`);
    }

    const vessels = await vesselsResponse.json();
    console.log("📊 Found vessels:", vessels.length);

    if (!vessels || vessels.length === 0) {
      return NextResponse.json([]);
    }

    // Process vessels and add health scores
    const out = vessels.map((v: any) => {
      // Generate realistic health data based on vessel characteristics
      const vesselName = v.vessel_name.toLowerCase();
      const vesselId = parseInt(v.vessel_id) || 0;
      
      // Use vessel ID to create consistent but varied health scores
      const seed = vesselId % 100; // Create variation based on ID
      
      let avg = 0.85; // Default good health
      
      if (vesselName.includes('onazia') || vesselName.includes('aamira')) {
        avg = 0.33; // 33% - critical issue as requested
      } else if (seed < 5) { // ~5% critical vessels
        avg = 0.25 + Math.random() * 0.15; // 25-40% critical
      } else if (seed < 15) { // ~10% watch vessels  
        avg = 0.45 + Math.random() * 0.25; // 45-70% watch
      } else { // ~85% healthy vessels
        avg = 0.75 + Math.random() * 0.2; // 75-95% healthy
      }

      return {
        id: v.vessel_id,
        name: v.vessel_name,
        health: avg, // 0–1
        lastUpdate: new Date().toISOString(),
        latitude: v.latitude,
        longitude: v.longitude,
      };
    });

    console.log("✅ Vessels API completed successfully");
    return NextResponse.json(out);
    
  } catch (error: any) {
    console.error("❌ Vessels API error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}