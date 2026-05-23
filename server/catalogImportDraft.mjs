import { sanitizeProducts } from "../scripts/lib/catalogSanitize.mjs";
import { buildImportPlan, normalizeProductNameForMatch, parseStrictCatalogRows, extractProductsFromPdfText } from "./catalogImport.mjs";
import { getSql } from "./db.mjs";
import crypto from "crypto";

let memoryState = null;

export function enableMemoryImportDraftForTests() {
  memoryState = { batch: null, items: [] };
}

export function resetMemoryImportDraftForTests() {
  memoryState = null;
}

function createBatchId() {
  return crypto.randomUUID();
}

function createItemId() {
  return crypto.randomUUID();
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildDraftItems(plan) {
  const candidates = [
    ...plan.toCreate.map((item) => ({ ...item, action: "create", existingId: null })),
    ...plan.toUpdate.map((item) => ({ ...item, action: "update" })),
  ];

  const { products, skipped: sanitizeSkipped } = sanitizeProducts(
    candidates.map((item, index) => ({
      id:
        item.action === "update"
          ? item.existingId
          : slugify(item.name) || `import-${index + 1}`,
      name: item.name,
      category: item.category,
      presentations: item.presentations,
      isVegan: item.isVegan,
      isKeto: item.isKeto,
      isGlutenFree: item.isGlutenFree,
    }))
  );

  const candidateByName = new Map(
    candidates.map((item) => [normalizeProductNameForMatch(item.name), item])
  );

  const items = products.map((product, index) => {
    const source = candidateByName.get(normalizeProductNameForMatch(product.name));
    return {
      id: createItemId(),
      action: source?.action ?? "create",
      sortOrder: index,
      payload: product,
      existingId: source?.existingId ?? null,
    };
  });

  return { items, sanitizeSkipped };
}

function buildSummary(plan, items) {
  return {
    newCategories: plan.newCategories,
    toCreate: items.filter((item) => item.action === "create").length,
    toUpdate: items.filter((item) => item.action === "update").length,
    skipped: plan.skipped.length,
  };
}

async function discardDraftsDb(sql) {
  await sql`
    UPDATE catalog_import_batches
    SET status = 'discarded'
    WHERE status = 'draft'
  `;
}

async function saveDraftDb({ plan, items, importMode, updateExisting, sourceFilename }) {
  const sql = getSql();
  await discardDraftsDb(sql);

  const batchId = createBatchId();
  const options = { updateExisting: Boolean(updateExisting) };

  await sql`
    INSERT INTO catalog_import_batches (id, status, source_filename, import_mode, options)
    VALUES (${batchId}, 'draft', ${sourceFilename ?? null}, ${importMode}, ${JSON.stringify(options)}::jsonb)
  `;

  for (const item of items) {
    await sql`
      INSERT INTO catalog_import_items (id, batch_id, action, sort_order, payload)
      VALUES (
        ${item.id},
        ${batchId},
        ${item.action},
        ${item.sortOrder},
        ${JSON.stringify(item.payload)}::jsonb
      )
    `;
  }

  return {
    batchId,
    summary: buildSummary(plan, items),
    items,
  };
}

function saveDraftMemory({ plan, items, importMode, updateExisting, sourceFilename }) {
  const batchId = createBatchId();
  memoryState = {
    batch: {
      id: batchId,
      status: "draft",
      sourceFilename: sourceFilename ?? null,
      importMode,
      options: { updateExisting: Boolean(updateExisting) },
    },
    items,
  };

  return {
    batchId,
    summary: buildSummary(plan, items),
    items,
  };
}

export async function replaceActiveDraftFromPlan({
  plan,
  importMode,
  updateExisting,
  sourceFilename,
}) {
  const { items } = buildDraftItems(plan);

  if (memoryState) {
    return saveDraftMemory({ plan, items, importMode, updateExisting, sourceFilename });
  }

  return saveDraftDb({ plan, items, importMode, updateExisting, sourceFilename });
}

export async function getActiveImportDraft() {
  if (memoryState) {
    if (memoryState.batch?.status !== "draft") {
      return null;
    }

    return {
      batch: memoryState.batch,
      items: memoryState.items,
      summary: {
        newCategories: [],
        toCreate: memoryState.items.filter((item) => item.action === "create").length,
        toUpdate: memoryState.items.filter((item) => item.action === "update").length,
        skipped: 0,
      },
    };
  }

  const sql = getSql();
  const batches = await sql`
    SELECT id, status, source_filename, import_mode, options, created_at, published_at
    FROM catalog_import_batches
    WHERE status = 'draft'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const batch = batches[0];
  if (!batch) return null;

  const rows = await sql`
    SELECT id, action, sort_order, payload
    FROM catalog_import_items
    WHERE batch_id = ${batch.id}
    ORDER BY sort_order ASC
  `;

  const items = rows.map((row) => ({
    id: row.id,
    action: row.action,
    sortOrder: row.sort_order,
    payload: row.payload,
  }));

  return {
    batch: {
      id: batch.id,
      status: batch.status,
      sourceFilename: batch.source_filename,
      importMode: batch.import_mode,
      options: batch.options,
      createdAt: batch.created_at,
      publishedAt: batch.published_at,
    },
    items,
    summary: {
      toCreate: items.filter((item) => item.action === "create").length,
      toUpdate: items.filter((item) => item.action === "update").length,
      skipped: 0,
    },
  };
}

export async function createImportDraftFromRows({
  rows,
  liveProducts,
  liveCategories,
  importMode,
  updateExisting,
  sourceFilename,
}) {
  const parsedProducts = parseStrictCatalogRows(rows);
  const plan = buildImportPlan({
    parsedProducts,
    liveProducts,
    liveCategories,
    importMode,
    updateExisting,
  });

  return replaceActiveDraftFromPlan({
    plan,
    importMode,
    updateExisting,
    sourceFilename,
  });
}

export async function createImportDraftFromPdfText({
  pdfText,
  liveProducts,
  liveCategories,
  importMode,
  updateExisting,
  sourceFilename,
}) {
  const parsedProducts = extractProductsFromPdfText(pdfText);
  if (!parsedProducts.length) {
    throw new ImportDraftError("empty_pdf_catalog", "No se encontraron productos en el PDF.");
  }

  const plan = buildImportPlan({
    parsedProducts,
    liveProducts,
    liveCategories,
    importMode,
    updateExisting,
  });

  return replaceActiveDraftFromPlan({
    plan,
    importMode,
    updateExisting,
    sourceFilename,
  });
}

export async function createImportDraftFromPdfBuffer({
  pdfBuffer,
  liveProducts,
  liveCategories,
  importMode,
  updateExisting,
  sourceFilename,
}) {
  let pdfParse;
  try {
    pdfParse = (await import("pdf-parse")).default;
  } catch {
    throw new ImportDraftError("pdf_parser_unavailable", "No está disponible el parser de PDF.");
  }

  const parsed = await pdfParse(pdfBuffer);
  return createImportDraftFromPdfText({
    pdfText: parsed.text || "",
    liveProducts,
    liveCategories,
    importMode,
    updateExisting,
    sourceFilename,
  });
}

function sanitizeDraftPayload(payload) {
  const { products } = sanitizeProducts([payload]);
  if (!products.length) {
    throw new ImportDraftError("invalid_draft_item", "El producto del borrador no es válido.");
  }
  return products[0];
}

export async function updateImportDraftItem(itemId, input) {
  const draft = await getActiveImportDraft();
  if (!draft) {
    throw new ImportDraftError("no_active_draft", "No hay un borrador activo para editar.");
  }

  const item = draft.items.find((entry) => entry.id === itemId);
  if (!item) {
    throw new ImportDraftError("draft_item_not_found", "No se encontró el producto en el borrador.");
  }

  const nextPayload = sanitizeDraftPayload({
    ...item.payload,
    ...input,
    id: item.payload.id,
  });

  if (memoryState?.batch?.status === "draft") {
    memoryState.items = memoryState.items.map((entry) =>
      entry.id === itemId
        ? { ...entry, payload: nextPayload, updatedAt: new Date().toISOString() }
        : entry
    );
    return memoryState.items.find((entry) => entry.id === itemId);
  }

  const sql = getSql();
  await sql`
    UPDATE catalog_import_items
    SET payload = ${JSON.stringify(nextPayload)}::jsonb, updated_at = now()
    WHERE id = ${itemId}
  `;

  return {
    ...item,
    payload: nextPayload,
  };
}

export async function renameImportDraftCategory(currentName, nextName) {
  const draft = await getActiveImportDraft();
  if (!draft) {
    throw new ImportDraftError("no_active_draft", "No hay un borrador activo para editar.");
  }

  const normalizedCurrent = normalizeProductNameForMatch(currentName);
  const trimmedNext = String(nextName ?? "").trim();
  if (!trimmedNext) {
    throw new ImportDraftError("invalid_category_name", "El nombre de categoría es obligatorio.");
  }

  let updatedItems = 0;

  if (memoryState?.batch?.status === "draft") {
    memoryState.items = memoryState.items.map((entry) => {
      if (normalizeProductNameForMatch(entry.payload.category) !== normalizedCurrent) {
        return entry;
      }
      updatedItems += 1;
      return {
        ...entry,
        payload: sanitizeDraftPayload({
          ...entry.payload,
          category: trimmedNext,
        }),
      };
    });
    return { updatedItems };
  }

  const sql = getSql();
  for (const item of draft.items) {
    if (normalizeProductNameForMatch(item.payload.category) !== normalizedCurrent) continue;
    const nextPayload = sanitizeDraftPayload({
      ...item.payload,
      category: trimmedNext,
    });
    await sql`
      UPDATE catalog_import_items
      SET payload = ${JSON.stringify(nextPayload)}::jsonb, updated_at = now()
      WHERE id = ${item.id}
    `;
    updatedItems += 1;
  }

  return { updatedItems };
}

export async function removeImportDraftItem(itemId) {
  const draft = await getActiveImportDraft();
  if (!draft) {
    throw new ImportDraftError("no_active_draft", "No hay un borrador activo.");
  }

  const item = draft.items.find((entry) => entry.id === itemId);
  if (!item) {
    throw new ImportDraftError("draft_item_not_found", "No se encontró el producto en el borrador.");
  }

  if (memoryState?.batch?.status === "draft") {
    memoryState.items = memoryState.items.filter((entry) => entry.id !== itemId);
    return { id: itemId };
  }

  const sql = getSql();
  await sql`DELETE FROM catalog_import_items WHERE id = ${itemId}`;
  return { id: itemId };
}

export class ImportDraftError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ImportDraftError";
    this.code = code;
  }
}

function uniqueCategoriesFromDraft(draft) {
  const categories = new Set();
  for (const item of draft.items) {
    if (item.payload?.category) categories.add(item.payload.category);
  }
  return [...categories];
}

async function markBatchPublished(batchId) {
  if (memoryState?.batch?.id === batchId) {
    memoryState.batch.status = "published";
    memoryState.batch.publishedAt = new Date().toISOString();
    memoryState.items = [];
    return;
  }

  const sql = getSql();
  await sql`
    UPDATE catalog_import_batches
    SET status = 'published', published_at = now()
    WHERE id = ${batchId}
  `;
}

export async function publishImportDraft(catalogDeps) {
  const draft = await getActiveImportDraft();
  if (!draft) {
    throw new ImportDraftError("no_active_draft", "No hay un borrador activo para publicar.");
  }

  const deps =
    catalogDeps ?? (await import("./catalogPublishDeps.mjs")).getCatalogPublishDeps();

  const publish = async () => {
    const existingCategories = new Set((await deps.listCategories()).map((category) => category.name));
    let created = 0;
    let updated = 0;

    for (const categoryName of uniqueCategoriesFromDraft(draft)) {
      if (!existingCategories.has(categoryName)) {
        await deps.createCategory({ name: categoryName });
        existingCategories.add(categoryName);
      }
    }

    for (const item of draft.items) {
      if (item.action === "update") {
        await deps.updateProduct(item.payload.id, item.payload);
        updated += 1;
        continue;
      }
      await deps.createProduct(item.payload);
      created += 1;
    }

    await markBatchPublished(draft.batch.id);
    return { created, updated };
  };

  if (typeof deps.runInTransaction === "function") {
    return deps.runInTransaction(publish);
  }

  return publish();
}

export async function discardActiveImportDraft() {
  const draft = await getActiveImportDraft();
  if (!draft) {
    throw new ImportDraftError("no_active_draft", "No hay un borrador activo para descartar.");
  }

  if (memoryState?.batch?.status === "draft") {
    memoryState.batch.status = "discarded";
    memoryState.items = [];
    return { discardedBatchId: draft.batch.id };
  }

  const sql = getSql();
  await sql`
    UPDATE catalog_import_batches
    SET status = 'discarded'
    WHERE id = ${draft.batch.id}
  `;
  return { discardedBatchId: draft.batch.id };
}
