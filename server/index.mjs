import "dotenv/config";
import cors from "cors";
import express from "express";
import { neon } from "@neondatabase/serverless";

const app = express();
const PORT = Number(process.env.API_PORT) || 8787;

app.use(cors({ origin: true }));
app.use(express.json());

let sql;
function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error("DATABASE_URL no está definida");
  }
  if (!sql) sql = neon(url.trim());
  return sql;
}

app.get("/api/health", async (_req, res) => {
  try {
    const query = getSql();
    const rows = await query`SELECT 1 AS ok`;
    res.json({ ok: true, db: rows?.[0] ?? null });
  } catch (err) {
    console.error("[api/health]", err);
    res.status(500).json({ ok: false, error: "db_error" });
  }
});

app.listen(PORT, () => {
  console.log(`API lista en http://localhost:${PORT}`);
});
