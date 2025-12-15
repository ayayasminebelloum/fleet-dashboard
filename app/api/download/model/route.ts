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
      ae.sensor_id,
      ae.reconstruction_error,
      gru.forecast_error,
      reg.predicted_value,
      ae.timestamp
    FROM model_ae_outputs ae
    LEFT JOIN model_gru_outputs gru
      ON gru.sensor_id = ae.sensor_id AND gru.timestamp = ae.timestamp
    LEFT JOIN model_regression_outputs reg
      ON reg.sensor_id = ae.sensor_id AND reg.timestamp = ae.timestamp
    ORDER BY ae.timestamp DESC
    LIMIT 50000;
  `;

  const result = await client.query(query);

  const csv =
    Object.keys(result.rows[0] || { no: "data" }).join(",") +
    "\n" +
    result.rows
      .map((r: any) =>
        Object.values(r)
          .map((v) => `"${v}"`)
          .join(",")
      )
      .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="model_outputs.csv"',
    },
  });
}
