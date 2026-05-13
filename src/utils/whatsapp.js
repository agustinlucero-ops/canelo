const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(value) {
  return CURRENCY_FORMATTER.format(value);
}

export function buildWhatsAppMessage({ storeName, customerName, customerPhone, items, totals }) {
  const lines = [
    `Hola, quiero hacer un pedido en ${storeName}:`,
    "",
    ...items.map(
      (item, index) =>
        `${index + 1}. ${item.name} (${item.presentation}) x${item.quantity} - ${formatPrice(
          item.unitPrice * item.quantity
        )}`
    ),
    "",
    `Total: ${formatPrice(totals.total)}`,
    "",
    `Nombre: ${customerName || "Sin nombre"}`,
    `Telefono: ${customerPhone || "Sin telefono"}`,
  ];

  return lines.join("\n");
}

export function buildWhatsAppLink({ phoneNumber, message }) {
  const normalizedPhone = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
