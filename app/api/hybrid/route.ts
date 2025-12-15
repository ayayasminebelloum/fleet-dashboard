import { NextResponse } from "next/server";
import { Client } from "pg";

function createClient() {
  return new Client({
    host: "db.atvqkntixckpyspxvgca.supabase.co",
    port: 5432,
    user: "postgres",
    password: "VesselIQ@2025",
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  });
}

function extractCT(sensorName: string | null): string | null {
  if (!sensorName) return null;
  const match = sensorName.match(/CT\d+\.\d+/i);
  return match ? match[0] : null;
}

export async function GET() {
  const client = createClient();
  
  try {
    await client.connect();
    console.log("✅ Connected to Supabase Postgres");
    console.log("🚀 Starting automatic batch processing of all hybrid_health rows...");

    let totalUpdated = 0;
    let totalSkipped = 0;
    let batchNumber = 1;
    const batchSize = 5000;

    while (true) {
      console.log(`📦 Processing batch #${batchNumber}...`);

      // FETCH 5,000 rows per batch
      const hhRes = await client.query(`
        SELECT id, sensor_name
        FROM hybrid_health
        WHERE sensor_id IS NULL
        ORDER BY id
        LIMIT ${batchSize};
      `);

      const rows = hhRes.rows;

      if (rows.length === 0) {
        console.log("🎉 All rows processed!");
        break;
      }

      console.log(`📌 Batch #${batchNumber} size: ${rows.length} rows`);

      let batchUpdated = 0;
      let batchSkipped = 0;

      for (const row of rows) {
        const ct = extractCT(row.sensor_name);

        if (!ct) {
          batchSkipped++;
          continue;
        }

        const sensorRes = await client.query(
          `
          SELECT sensor_id
          FROM sensors
          WHERE pi_point_name ILIKE '%' || $1 || '%'
             OR raw_sensor_id ILIKE '%' || $1 || '%'
          LIMIT 1;
          `,
          [ct]
        );

        if (sensorRes.rows.length === 0) {
          batchSkipped++;
          continue;
        }

        const sensorId = sensorRes.rows[0].sensor_id;

        await client.query(
          `
          UPDATE hybrid_health
          SET sensor_id = $1
          WHERE id = $2;
          `,
          [sensorId, row.id]
        );

        batchUpdated++;
      }

      totalUpdated += batchUpdated;
      totalSkipped += batchSkipped;

      console.log(`✅ Batch #${batchNumber} complete: ${batchUpdated} updated, ${batchSkipped} skipped`);
      console.log(`📊 Running totals: ${totalUpdated} updated, ${totalSkipped} skipped`);

      batchNumber++;

      // Small delay between batches to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      message: "🎉 All batches processed successfully!",
      total_updated: totalUpdated,
      total_skipped: totalSkipped,
      batches_processed: batchNumber - 1
    });

  } catch (err: any) {
    console.error("❌ ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    try {
      await client.end();
      console.log("🔌 Hybrid API connection closed");
    } catch (endError) {
      console.log("⚠️ Error closing hybrid connection:", endError);
    }
  }
}
