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

export async function createCategory(name) {
  const payload = await requestJson("/api/categories", {
    method: "POST",
    body: { name },
    fallbackCode: "category_create_failed",
    fallbackMessage: "No se pudo crear la categoría.",
  });
  return payload.category;
}

export async function renameCategory(currentName, nextName) {
  const payload = await requestJson(`/api/categories/${encodeURIComponent(currentName)}`, {
    method: "PUT",
    body: { nextName },
    fallbackCode: "category_rename_failed",
    fallbackMessage: "No se pudo renombrar la categoría.",
  });
  return payload.category;
}

export async function deleteCategory(name) {
  const payload = await requestJson(`/api/categories/${encodeURIComponent(name)}`, {
    method: "DELETE",
    fallbackCode: "category_delete_failed",
    fallbackMessage: "No se pudo eliminar la categoría.",
  });
  return payload.result;
}

export async function createProduct(product) {
  const payload = await requestJson("/api/products", {
    method: "POST",
    body: product,
    fallbackCode: "product_create_failed",
    fallbackMessage: "No se pudo crear el producto.",
  });
  return payload.product;
}

export async function updateProduct(productId, product) {
  const payload = await requestJson(`/api/products/${encodeURIComponent(productId)}`, {
    method: "PUT",
    body: product,
    fallbackCode: "product_update_failed",
    fallbackMessage: "No se pudo guardar el producto.",
  });
  return payload.product;
}

export async function deleteProduct(productId) {
  const payload = await requestJson(`/api/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    fallbackCode: "product_delete_failed",
    fallbackMessage: "No se pudo eliminar el producto.",
  });
  return payload.result;
}
