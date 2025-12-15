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
    SELECT *
    FROM detected_outliers
    ORDER BY timestamp DESC
    LIMIT 50000;
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
      "Content-Disposition": 'attachment; filename="detected_outliers.csv"',
    },
  });
}
