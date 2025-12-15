import { NextResponse } from "next/server";
import { Client } from "pg";

function createClient() {
  return new Client({
    host: process.env.DB_HOST || "aws-0-us-east-1.pooler.supabase.com",
    port: parseInt(process.env.DB_PORT || "6543"),
    user: process.env.DB_USER || "postgres", 
    password: process.env.DB_PASSWORD || "VesselIQ@2025",
    database: process.env.DB_NAME || "postgres",
    ssl: { rejectUnauthorized: false }
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = createClient();
  
  try {
    await client.connect();
    console.log("✅ Connected to Postgres for vessel detail");
    const vesselId = id;

    // Get vessel details
    const vesselRes = await client.query(`
      SELECT vessel_id, vessel_name, latitude, longitude, created_at
      FROM vessels
      WHERE vessel_id = $1
    `, [vesselId]);

    if (vesselRes.rows.length === 0) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    const vessel = vesselRes.rows[0];

    // Get sensors for this vessel
    const sensorsRes = await client.query(`
      SELECT sensor_id, raw_sensor_id, pi_point_name, subsystem, created_at
      FROM sensors
      WHERE vessel_id = $1
      ORDER BY subsystem, sensor_id
    `, [vesselId]);

    const sensors = sensorsRes.rows;

    return NextResponse.json({ vessel, sensors });
    
  } catch (error: any) {
    console.error("❌ Vessel detail API error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  } finally {
    try {
      await client.end();
      console.log("🔌 Vessel detail connection closed");
    } catch (endError) {
      console.log("⚠️ Error closing vessel detail connection:", endError);
    }
  }
}
