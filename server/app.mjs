import "dotenv/config";
import cors from "cors";
import express from "express";
import {
  CatalogError,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProductById,
  listCategories,
  listProducts,
  renameCategory,
  updateProduct,
} from "./catalog.mjs";
import { getSql } from "./db.mjs";
import { OrderError, createOrder, listOrders } from "./orders.mjs";
import {
  createAdminToken,
  extractBearerToken,
  getSessionTtlMs,
  isAdminAuthConfigured,
  validateAdminCredentials,
  verifyAdminToken,
} from "./auth.mjs";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

function sendApiError(res, err, defaultCode = "internal_error", defaultMessage = "Error interno") {
  if (err instanceof OrderError) {
    const statusByCode = {
      invalid_order_items: 400,
      invalid_order_item: 400,
    };
    res.status(statusByCode[err.code] ?? 400).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof CatalogError) {
    const statusByCode = {
      invalid_category_name: 400,
      invalid_product_name: 400,
      invalid_product_category: 400,
      invalid_presentations: 400,
      reserved_category: 400,
      default_category_protected: 400,
      category_not_found: 404,
      product_not_found: 404,
      category_conflict: 409,
      product_conflict: 409,
    };
    const statusCode = statusByCode[err.code] ?? 400;
    res.status(statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      code: defaultCode,
      message: defaultMessage,
    },
  });
}

function buildAuditMeta(req, extra = {}) {
  return {
    method: req.method,
    path: req.path,
    ip: req.ip,
    ...extra,
  };
}

function requireAdminAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!verifyAdminToken(token)) {
    res.status(401).json({
      error: {
        code: "unauthorized",
        message: "Sesión admin inválida o expirada. Volvé a ingresar.",
      },
    });
    return;
  }
  next();
}

app.post("/api/admin/login", (req, res) => {
  if (!isAdminAuthConfigured()) {
    res.status(503).json({
      error: {
        code: "auth_not_configured",
        message: "El acceso admin no está configurado en el servidor.",
      },
    });
    return;
  }

  const { user, password } = req.body ?? {};
  if (!validateAdminCredentials(user, password)) {
    res.status(401).json({
      error: {
        code: "invalid_credentials",
        message: "Usuario o clave incorrecta.",
      },
    });
    return;
  }

  try {
    const token = createAdminToken();
    res.json({ ok: true, token, expiresIn: getSessionTtlMs() });
  } catch (err) {
    console.error("[api/admin/login]", err);
    res.status(500).json({
      error: {
        code: "auth_error",
        message: "No se pudo iniciar sesión admin.",
      },
    });
  }
});

app.get("/api/admin/session", (req, res) => {
  const token = extractBearerToken(req);
  if (!verifyAdminToken(token)) {
    res.status(401).json({ ok: false });
    return;
  }
  res.json({ ok: true });
});

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

app.post("/api/categories", requireAdminAuth, async (req, res) => {
  const actionMeta = buildAuditMeta(req, { action: "create_category" });
  try {
    const category = await createCategory({ name: req.body?.name });
    console.info("[audit]", { ...actionMeta, result: "ok", category: category.name });
    res.status(201).json({ category });
  } catch (err) {
    console.error("[api/categories#create]", { ...actionMeta, result: "error", err });
    sendApiError(res, err, "db_error", "No se pudo crear la categoría.");
  }
});

app.put("/api/categories/:name", requireAdminAuth, async (req, res) => {
  const actionMeta = buildAuditMeta(req, { action: "rename_category", currentName: req.params.name });
  try {
    const category = await renameCategory({
      currentName: decodeURIComponent(req.params.name),
      nextName: req.body?.nextName,
    });
    console.info("[audit]", { ...actionMeta, result: "ok", nextName: category.name });
    res.json({ category });
  } catch (err) {
    console.error("[api/categories#update]", { ...actionMeta, result: "error", err });
    sendApiError(res, err, "db_error", "No se pudo renombrar la categoría.");
  }
});

app.delete("/api/categories/:name", requireAdminAuth, async (req, res) => {
  const actionMeta = buildAuditMeta(req, { action: "delete_category", categoryName: req.params.name });
  try {
    const result = await deleteCategory({ name: decodeURIComponent(req.params.name) });
    console.info("[audit]", { ...actionMeta, result: "ok", ...result });
    res.json({ ok: true, result });
  } catch (err) {
    console.error("[api/categories#delete]", { ...actionMeta, result: "error", err });
    sendApiError(res, err, "db_error", "No se pudo eliminar la categoría.");
  }
});

app.post("/api/products", requireAdminAuth, async (req, res) => {
  const actionMeta = buildAuditMeta(req, { action: "create_product", productId: req.body?.id });
  try {
    const product = await createProduct(req.body ?? {});
    console.info("[audit]", { ...actionMeta, result: "ok", productId: product.id });
    res.status(201).json({ product });
  } catch (err) {
    console.error("[api/products#create]", { ...actionMeta, result: "error", err });
    sendApiError(res, err, "db_error", "No se pudo crear el producto.");
  }
});

app.put("/api/products/:id", requireAdminAuth, async (req, res) => {
  const actionMeta = buildAuditMeta(req, { action: "update_product", productId: req.params.id });
  try {
    const product = await updateProduct(req.params.id, req.body ?? {});
    console.info("[audit]", { ...actionMeta, result: "ok", productId: product.id });
    res.json({ product });
  } catch (err) {
    console.error("[api/products#update]", { ...actionMeta, result: "error", err });
    sendApiError(res, err, "db_error", "No se pudo actualizar el producto.");
  }
});

app.delete("/api/products/:id", requireAdminAuth, async (req, res) => {
  const actionMeta = buildAuditMeta(req, { action: "delete_product", productId: req.params.id });
  try {
    const result = await deleteProduct(req.params.id);
    console.info("[audit]", { ...actionMeta, result: "ok", productId: result.id });
    res.json({ ok: true, result });
  } catch (err) {
    console.error("[api/products#delete]", { ...actionMeta, result: "error", err });
    sendApiError(res, err, "db_error", "No se pudo eliminar el producto.");
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const order = await createOrder({
      customerName: req.body?.customerName,
      customerPhone: req.body?.customerPhone,
      items: req.body?.items,
    });
    res.status(201).json({ order });
  } catch (err) {
    console.error("[api/orders#create]", err);
    sendApiError(res, err, "order_create_failed", "No se pudo registrar el pedido.");
  }
});

app.get("/api/orders", requireAdminAuth, async (req, res) => {
  try {
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
    const orders = await listOrders({ limit });
    res.json({ orders });
  } catch (err) {
    console.error("[api/orders#list]", err);
    sendApiError(res, err, "order_list_failed", "No se pudieron cargar los pedidos.");
  }
});

export default app;
