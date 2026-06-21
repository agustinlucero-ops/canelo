import { describe, expect, it } from "vitest";
import {
  buildWhatsAppLink,
  buildWhatsAppMessage,
  encodeWhatsAppText,
  formatPrice,
} from "./whatsapp";

describe("whatsapp utils", () => {
  it("formats ARS prices", () => {
    expect(formatPrice(1500)).toContain("1");
    expect(formatPrice(1500)).toContain("500");
  });

  it("builds order message with BMP symbols", () => {
    const message = buildWhatsAppMessage({
      customerName: "Ana",
      customerPhone: "Av. Rivadavia 4521",
      items: [
        {
          name: "Almendra",
          presentation: "1kg",
          quantity: 2,
          unitPrice: 1000,
        },
      ],
      totals: { total: 2000 },
    });

    expect(message).toBe(
      [
        "¡Hola! Les mando el pedido que armé en la web de Canelo ♥:",
        "",
        "Almendra (1kg) x2 → $2.000",
        "",
        "Total: $2.000",
        "",
        "Mis datos:",
        "Nombre: Ana",
        "Dirección: Av. Rivadavia 4521",
        "",
        "¡Avísenme cómo seguimos!",
      ].join("\n")
    );
    expect(message).not.toMatch(/\u{1F000}/u);
  });

  it("incluye cantidad y descuento en cada línea del pedido", () => {
    const message = buildWhatsAppMessage({
      customerName: "Ana",
      customerPhone: "Av. Rivadavia 4521",
      items: [
        {
          name: "Almendra",
          presentation: "500g",
          quantity: 2,
          unitPrice: 14400,
          listPrice: 16000,
          discountPercent: 10,
        },
      ],
      totals: { total: 28800 },
    });

    expect(message).toContain("Almendra (500g) x2 → $28.800 (10% OFF)");
  });

  it("encodes text as UTF-8 percent escapes", () => {
    expect(encodeWhatsAppText("→")).toBe("%E2%86%92");
    expect(encodeWhatsAppText("♥")).toBe("%E2%99%A5");
  });

  it("uses whatsapp protocol on mobile", () => {
    const link = buildWhatsAppLink({
      phoneNumber: "5491122334455",
      message: "Hola →",
      client: "mobile",
    });

    expect(link.startsWith("whatsapp://send?phone=5491122334455&text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe("Hola →");
    expect(link).not.toContain("wa.me");
  });

  it("uses web.whatsapp.com on desktop", () => {
    const message = "Hola ♥";
    const link = buildWhatsAppLink({
      phoneNumber: "5491122334455",
      message,
      client: "desktop",
    });

    expect(link).toBe(
      `https://web.whatsapp.com/send?phone=5491122334455&text=${encodeWhatsAppText(message)}`
    );
  });
});
