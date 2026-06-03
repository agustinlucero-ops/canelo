const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Escapes Unicode: evita corrupción si el archivo no se guarda en UTF-8. */
const EMOJI = {
  greenHeart: "\u{1F49A}",
  pointRight: "\u{1F449}",
  moneyBag: "\u{1F4B0}",
  person: "\u{1F464}",
  house: "\u{1F3E1}",
  raisedHands: "\u{1F64C}",
};

export function formatPrice(value) {
  return CURRENCY_FORMATTER.formatToParts(value)
    .filter((part) => !(part.type === "literal" && part.value.trim() === ""))
    .map((part) => part.value)
    .join("");
}

export function buildWhatsAppMessage({ customerName, customerPhone, items, totals }) {
  const productLines = items.map(
    (item) =>
      `${item.name} (${item.presentation}) ${EMOJI.pointRight} ${formatPrice(item.unitPrice * item.quantity)}`
  );

  return [
    `¡Hola! Les mando el pedido que armé en la web de Canelo ${EMOJI.greenHeart}:`,
    "",
    productLines.join("\n\n"),
    "",
    `${EMOJI.moneyBag}Total: ${formatPrice(totals.total)}`,
    "",
    "Mis datos:",
    `${EMOJI.person} ${customerName || "Sin nombre"}`,
    `${EMOJI.house} ${customerPhone || "Sin dirección"}`,
    "",
    `¡Avísenme cómo seguimos! ${EMOJI.raisedHands}`,
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

/**
 * wa.me corrompe emojis al redirigir (U+FFFD). API directa o WhatsApp Web preservan UTF-8.
 * @see https://stackoverflow.com/questions/66954605
 */
export function buildWhatsAppLink({ phoneNumber, message, client = "auto" }) {
  const normalizedPhone = phoneNumber.replace(/\D/g, "");
  const encodedText = encodeURIComponent(message);

  if (resolveWhatsAppClient(client) === "mobile") {
    return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`;
  }

  return `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`;
}

export function openWhatsAppLink(params) {
  const url = buildWhatsAppLink(params);
  window.open(url, "_blank", "noopener,noreferrer");
}
