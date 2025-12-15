import { NextResponse } from "next/server";
import { Client } from "pg";

const client = new Client({
  host: "db.atvqkntixckpyspxvgca.supabase.co",
  port: 5432,
  user: "postgres",
  password: "VesselIQ@2025",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

let connected = false;
async function connectOnce() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
}

export async function GET() {
  await connectOnce();

  const query = `
    SELECT 
      sensor_id,
      AVG(value)       AS avg_value,
      MIN(value)       AS min_value,
      MAX(value)       AS max_value,
      STDDEV(value)    AS std_value,
      COUNT(*)         AS count
    FROM raw_sensor_readings
    GROUP BY sensor_id
    ORDER BY sensor_id;
  `;

  const result = await client.query(query);

  const csv =
    Object.keys(result.rows[0]).join(",") +
    "\n" +
    result.rows.map((r: any) =>
      Object.values(r)
        .map((v) => `"${v}"`)
        .join(",")
    ).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="sensor_statistics.csv"',
    },
  });
}
