import { describe, expect, it } from "vitest";
import { buildWhatsAppLink, buildWhatsAppMessage, formatPrice } from "./whatsapp";

describe("whatsapp utils", () => {
  it("formats ARS prices", () => {
    expect(formatPrice(1500)).toContain("1");
    expect(formatPrice(1500)).toContain("500");
  });

  it("builds order message", () => {
    const message = buildWhatsAppMessage({
      storeName: "Dietetica Canelo",
      customerName: "Ana",
      customerPhone: "1112345678",
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

    expect(message).toContain("Ana");
    expect(message).toContain("Almendra");
    expect(message).toContain("1112345678");
  });

  it("builds wa.me link", () => {
    const link = buildWhatsAppLink({
      phoneNumber: "5491122334455",
      message: "Hola",
    });

    expect(link).toContain("https://wa.me/5491122334455");
    expect(link).toContain(encodeURIComponent("Hola"));
  });
});
