import { clearAdminToken, getAdminToken } from "./adminAuth";

const DEFAULT_TIMEOUT_MS = 12000;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function buildAdminHeaders(extraHeaders = {}) {
  const token = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

function toApiError(fallbackCode, fallbackMessage, status, payload) {
  const apiError = payload?.error;
  const error = new Error(apiError?.message || fallbackMessage);
  error.code = apiError?.code || fallbackCode;
  error.status = status;
  error.details = apiError?.details;
  return error;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: buildAdminHeaders(options.headers),
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function requestJson(url, { method = "GET", body, fallbackCode, fallbackMessage }) {
  let attempts = 0;
  while (attempts < 2) {
    attempts += 1;
    try {
      const response = await fetchWithTimeout(url, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      const isJson = response.headers.get("content-type")?.includes("application/json");
      const payload = isJson ? await response.json() : null;

      if (!response.ok) {
        if (response.status === 401) {
          clearAdminToken();
        }
        if (attempts < 2 && RETRYABLE_STATUS.has(response.status)) {
          continue;
        }
        throw toApiError(fallbackCode, fallbackMessage, response.status, payload);
      }

      return payload ?? {};
    } catch (err) {
      if (attempts < 2 && (err?.name === "AbortError" || err instanceof TypeError)) {
        continue;
      }
      if (err?.code) throw err;
      throw toApiError(fallbackCode, fallbackMessage, 0, null);
    }
  }

  throw toApiError(fallbackCode, fallbackMessage, 0, null);
}

export async function fetchImportDraft() {
  const payload = await requestJson("/api/admin/catalog/import/draft", {
    fallbackCode: "import_draft_read_failed",
    fallbackMessage: "No se pudo cargar el borrador.",
  });
  return payload.draft;
}

export async function parseCatalogImportRows({
  rows,
  importMode,
  updateExisting,
  sourceFilename,
}) {
  return requestJson("/api/admin/catalog/import/parse", {
    method: "POST",
    body: {
      rows,
      importMode,
      updateExisting,
      sourceFilename,
    },
    fallbackCode: "import_parse_failed",
    fallbackMessage: "No se pudo cargar el archivo al borrador.",
  });
}

export async function parseCatalogImportPdf({
  pdfBase64,
  pdfText,
  importMode,
  updateExisting,
  sourceFilename,
}) {
  return requestJson("/api/admin/catalog/import/parse-pdf", {
    method: "POST",
    body: {
      pdfBase64,
      pdfText,
      importMode,
      updateExisting,
      sourceFilename,
    },
    fallbackCode: "import_parse_pdf_failed",
    fallbackMessage: "No se pudo analizar el PDF.",
  });
}

export async function updateImportDraftItemApi(itemId, product) {
  const payload = await requestJson(`/api/admin/catalog/import/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: product,
    fallbackCode: "import_item_update_failed",
    fallbackMessage: "No se pudo editar el producto del borrador.",
  });
  return payload.item;
}

export async function removeImportDraftItemApi(itemId) {
  return requestJson(`/api/admin/catalog/import/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    fallbackCode: "import_item_delete_failed",
    fallbackMessage: "No se pudo quitar el producto del borrador.",
  });
}

export async function renameImportDraftCategoryApi(currentName, nextName) {
  return requestJson(
    `/api/admin/catalog/import/categories/${encodeURIComponent(currentName)}`,
    {
      method: "PATCH",
      body: { nextName },
      fallbackCode: "import_category_rename_failed",
      fallbackMessage: "No se pudo renombrar la categoría del borrador.",
    }
  );
}

export async function discardImportDraftApi() {
  return requestJson("/api/admin/catalog/import/discard", {
    method: "POST",
    fallbackCode: "import_discard_failed",
    fallbackMessage: "No se pudo descartar el borrador.",
  });
}

export async function publishImportDraftApi() {
  return requestJson("/api/admin/catalog/import/publish", {
    method: "POST",
    fallbackCode: "import_publish_failed",
    fallbackMessage: "No se pudo publicar el borrador.",
  });
}
