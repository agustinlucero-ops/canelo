const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/**
 * Símbolos del plano BMP. Los emoji pictográficos (U+1Fxxx) se corrompen en
 * wa.me, api.whatsapp.com y a menudo en WhatsApp Web al prefijar el mensaje.
 */
const SYMBOL = {
  greenHeart: "\u2665",
  pointRight: "\u2192",
};

export function formatPrice(value) {
  return CURRENCY_FORMATTER.formatToParts(value)
    .filter((part) => !(part.type === "literal" && part.value.trim() === ""))
    .map((part) => part.value)
    .join("");
}

export function encodeWhatsAppText(text) {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, (byte) => `%${byte.toString(16).toUpperCase().padStart(2, "0")}`).join("");
}

export function buildWhatsAppMessage({ customerName, customerPhone, items, totals }) {
  const productLines = items.map(
    (item) =>
      `${item.name} (${item.presentation}) ${SYMBOL.pointRight} ${formatPrice(item.unitPrice * item.quantity)}`
  );

  return [
    `¡Hola! Les mando el pedido que armé en la web de Canelo ${SYMBOL.greenHeart}:`,
    "",
    productLines.join("\n\n"),
    "",
    `Total: ${formatPrice(totals.total)}`,
    "",
    "Mis datos:",
    `Nombre: ${customerName || "Sin nombre"}`,
    `Dirección: ${customerPhone || "Sin dirección"}`,
    "",
    "¡Avísenme cómo seguimos!",
  ].join("\n");
}

export function isMobileWhatsAppClient() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function resolveWhatsAppClient(client = "auto") {
  if (client === "mobile" || client === "desktop") return client;
  return isMobileWhatsAppClient() ? "mobile" : "desktop";
}

export function buildWhatsAppLink({ phoneNumber, message, client = "auto" }) {
  const normalizedPhone = phoneNumber.replace(/\D/g, "");
  const encodedText = encodeWhatsAppText(message);

  if (resolveWhatsAppClient(client) === "mobile") {
    return `whatsapp://send?phone=${normalizedPhone}&text=${encodedText}`;
  }

  return `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`;
}

export function openWhatsAppLink(params) {
  const url = buildWhatsAppLink(params);
  const isMobile = resolveWhatsAppClient(params.client ?? "auto") === "mobile";

  if (isMobile) {
    window.location.assign(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
