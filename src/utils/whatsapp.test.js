import { describe, expect, it } from "vitest";
import { buildWhatsAppLink, buildWhatsAppMessage, formatPrice } from "./whatsapp";

describe("whatsapp utils", () => {
  it("formats ARS prices", () => {
    expect(formatPrice(1500)).toContain("1");
    expect(formatPrice(1500)).toContain("500");
  });

  it("builds order message", () => {
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
        "¡Hola! Les mando el pedido que armé en la web de Canelo 💚:",
        "",
        "Almendra (1kg) 👉 $2.000",
        "",
        "💰Total: $2.000",
        "",
        "Mis datos:",
        "👤 Ana",
        "🏡 Av. Rivadavia 4521",
        "",
        "¡Avísenme cómo seguimos! 🙌",
      ].join("\n")
    );
  });

  it("builds wa.me link", () => {
    const link = buildWhatsAppLink({
      phoneNumber: "5491122334455",
      message: "Hola",
    });

    expect(link).toContain("https://wa.me/5491122334455");
    expect(link).toContain(encodeURIComponent("Hola"));
  });

  it("preserves emoji code points in encoded link", () => {
    const message = buildWhatsAppMessage({
      customerName: "Ana",
      customerPhone: "CABA",
      items: [{ name: "Almendra", presentation: "1kg", quantity: 1, unitPrice: 1000 }],
      totals: { total: 1000 },
    });
    const decoded = decodeURIComponent(buildWhatsAppLink({
      phoneNumber: "5491122334455",
      message,
    }).split("text=")[1]);

    expect(decoded).toContain("\u{1F49A}");
    expect(decoded).toContain("\u{1F449}");
    expect(decoded).toContain("\u{1F4B0}");
    expect(decoded).toContain("\u{1F464}");
    expect(decoded).toContain("\u{1F3E1}");
    expect(decoded).toContain("\u{1F64C}");
  });
});
