import { getAdminToken } from "./adminAuth";

export async function createOrder({ customerName, customerPhone, items }) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerName, customerPhone, items }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "No se pudo registrar el pedido.");
    error.code = payload?.error?.code || "order_create_failed";
    throw error;
  }

  return payload.order;
}

export async function fetchOrders({ limit = 50 } = {}) {
  const token = getAdminToken();
  const response = await fetch(`/api/orders?limit=${limit}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "No se pudieron cargar los pedidos.");
    error.status = response.status;
    throw error;
  }

  return payload.orders ?? [];
}
