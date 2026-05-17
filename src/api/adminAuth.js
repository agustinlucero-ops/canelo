const ADMIN_TOKEN_STORAGE_KEY = "canelo.admin-token";

export function getAdminToken() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";
}

export function setAdminToken(token) {
  if (typeof window === "undefined") return;
  if (!token) {
    window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

export function clearAdminToken() {
  setAdminToken("");
}

export async function loginAdmin(user, password) {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, password }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      (response.status === 503
        ? "El acceso admin no está configurado en el servidor."
        : "Usuario o clave incorrecta.");
    const error = new Error(message);
    error.code = payload?.error?.code || "admin_login_failed";
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function verifyAdminSession() {
  const token = getAdminToken();
  if (!token) {
    return false;
  }

  const response = await fetch("/api/admin/session", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    clearAdminToken();
    return false;
  }

  const payload = await response.json().catch(() => null);
  return Boolean(payload?.ok);
}
