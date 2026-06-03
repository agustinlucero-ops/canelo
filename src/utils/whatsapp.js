const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(value) {
  return CURRENCY_FORMATTER.formatToParts(value)
    .filter((part) => !(part.type === "literal" && part.value.trim() === ""))
    .map((part) => part.value)
    .join("");
}

export function buildWhatsAppMessage({ customerName, customerPhone, items, totals }) {
  const productLines = items.map(
    (item) =>
      `${item.name} (${item.presentation}) 👉 ${formatPrice(item.unitPrice * item.quantity)}`
  );

  return [
    "¡Hola! Les mando el pedido que armé en la web de Canelo 💚:",
    "",
    productLines.join("\n\n"),
    "",
    `💰Total: ${formatPrice(totals.total)}`,
    "",
    "Mis datos:",
    `👤 ${customerName || "Sin nombre"}`,
    `🏡 ${customerPhone || "Sin dirección"}`,
    "",
    "¡Avísenme cómo seguimos! 🙌",
  ].join("\n");
}

export function buildWhatsAppLink({ phoneNumber, message }) {
  const normalizedPhone = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
