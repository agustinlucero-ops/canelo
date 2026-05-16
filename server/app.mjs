import "dotenv/config";
import cors from "cors";
import express from "express";
import { getProductById, listCategories, listProducts } from "./catalog.mjs";
import { getSql } from "./db.mjs";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

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

app.get("/api/categories", async (_req, res) => {
  try {
    const categories = await listCategories();
    res.json({ categories });
  } catch (err) {
    console.error("[api/categories]", err);
    res.status(500).json({ error: "db_error" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const products = await listProducts({ category });
    res.json({ products });
  } catch (err) {
    console.error("[api/products]", err);
    res.status(500).json({ error: "db_error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ product });
  } catch (err) {
    console.error("[api/products/:id]", err);
    res.status(500).json({ error: "db_error" });
  }
});

export default app;
