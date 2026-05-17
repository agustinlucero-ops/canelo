import crypto from "crypto";
import { getSql } from "./db.mjs";

export class OrderError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "OrderError";
    this.code = code;
    this.details = details;
  }
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new OrderError("invalid_order_items", "El pedido debe incluir al menos un producto.");
  }

  return items.map((item, index) => {
    const productName = normalizeText(item?.name ?? item?.productName);
    const presentationLabel = normalizeText(item?.presentation ?? item?.presentationLabel);
    const unitPrice = Math.round(Number(item?.unitPrice));
    const quantity = Math.round(Number(item?.quantity));

    if (!productName || !presentationLabel) {
      throw new OrderError("invalid_order_item", `El item ${index + 1} es inválido.`);
    }
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      throw new OrderError("invalid_order_item", `Precio inválido en el item ${index + 1}.`);
    }
    if (Number.isNaN(quantity) || quantity <= 0) {
      throw new OrderError("invalid_order_item", `Cantidad inválida en el item ${index + 1}.`);
    }

    return {
      productId: normalizeText(item?.productId) || null,
      productName,
      presentationLabel,
      unitPrice,
      quantity,
    };
  });
}

function computeTotals(items) {
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  return { subtotal, total: subtotal };
}

export async function createOrder({
  customerName,
  customerPhone,
  items,
}) {
  const sql = getSql();
  const normalizedItems = normalizeOrderItems(items);
  const { subtotal, total } = computeTotals(normalizedItems);
  const orderId = crypto.randomUUID();

  await sql`
    INSERT INTO orders (id, customer_name, customer_phone, subtotal, total, status)
    VALUES (
      ${orderId},
      ${normalizeText(customerName) || null},
      ${normalizeText(customerPhone) || null},
      ${subtotal},
      ${total},
      'sent_whatsapp'
    )
  `;

  for (const item of normalizedItems) {
    await sql`
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name,
        presentation_label,
        unit_price,
        quantity
      )
      VALUES (
        ${orderId},
        ${item.productId},
        ${item.productName},
        ${item.presentationLabel},
        ${item.unitPrice},
        ${item.quantity}
      )
    `;
  }

  return {
    id: orderId,
    customerName: normalizeText(customerName) || null,
    customerPhone: normalizeText(customerPhone) || null,
    subtotal,
    total,
    status: "sent_whatsapp",
    items: normalizedItems,
  };
}

export async function listOrders({ limit = 50 } = {}) {
  const sql = getSql();
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const orderRows = await sql`
    SELECT id, customer_name, customer_phone, subtotal, total, status, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;

  if (!orderRows.length) {
    return [];
  }

  const orderIds = orderRows.map((row) => row.id);
  const itemRows = await sql`
    SELECT order_id, product_id, product_name, presentation_label, unit_price, quantity
    FROM order_items
    WHERE order_id = ANY(${orderIds})
    ORDER BY id ASC
  `;

  const itemsByOrderId = itemRows.reduce((acc, row) => {
    if (!acc[row.order_id]) {
      acc[row.order_id] = [];
    }
    acc[row.order_id].push({
      productId: row.product_id,
      productName: row.product_name,
      presentationLabel: row.presentation_label,
      unitPrice: row.unit_price,
      quantity: row.quantity,
    });
    return acc;
  }, {});

  return orderRows.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    subtotal: row.subtotal,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    items: itemsByOrderId[row.id] ?? [],
  }));
}
