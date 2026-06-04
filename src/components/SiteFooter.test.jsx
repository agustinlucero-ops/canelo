import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { encodeWhatsAppText } from "../utils/whatsapp";
import SiteFooter from "./SiteFooter";

describe("SiteFooter", () => {
  it("muestra el copyright de la dietética en el pie de página", () => {
    const html = renderToStaticMarkup(
      <SiteFooter legal={{ businessName: "Dietética Canelo", year: 2026 }} />
    );

    expect(html).toContain('role="contentinfo"');
    expect(html).toContain("© 2026 Dietética Canelo");
  });

  it("muestra Ingresar admin cuando el acceso admin está habilitado", () => {
    const html = renderToStaticMarkup(
      <SiteFooter showAdminLink legal={{ businessName: "Dietética Canelo", year: 2026 }} />
    );

    expect(html).toContain("Ingresar admin");
    expect(html).toContain("admin-access-link");
  });

  it("no muestra Ingresar admin cuando el acceso admin está deshabilitado", () => {
    const html = renderToStaticMarkup(
      <SiteFooter showAdminLink={false} legal={{ businessName: "Dietética Canelo", year: 2026 }} />
    );

    expect(html).not.toContain("Ingresar admin");
  });

  it("muestra la dirección cuando está configurada en contacto", () => {
    const html = renderToStaticMarkup(
      <SiteFooter
        contact={{ address: "Av. Corrientes 1234, CABA" }}
        legal={{ businessName: "Dietética Canelo", year: 2026 }}
      />
    );

    expect(html).toContain("Av. Corrientes 1234, CABA");
    expect(html).toContain("site-footer-address");
  });

  it("ofrece consulta por WhatsApp con mensaje prellenado", () => {
    const html = renderToStaticMarkup(
      <SiteFooter
        contact={{}}
        whatsappPhone="5491111222333"
        whatsappInquiryMessage="Hola, consulta desde el footer"
        legal={{ businessName: "Dietética Canelo", year: 2026 }}
      />
    );

    expect(html).toContain("Consultanos por WhatsApp");
    expect(html).toContain("web.whatsapp.com/send?phone=5491111222333");
    expect(html).toContain(encodeWhatsAppText("Hola, consulta desde el footer"));
  });

  it("lista enlaces de redes cuando tienen URL", () => {
    const html = renderToStaticMarkup(
      <SiteFooter
        contact={{}}
        whatsappInquiryMessage=""
        socialLinks={[{ label: "Instagram", url: "https://instagram.com/canelo" }]}
        legal={{ businessName: "Dietética Canelo", year: 2026 }}
      />
    );

    expect(html).toContain("Instagram");
    expect(html).toContain('href="https://instagram.com/canelo"');
  });

  it("omite campos de contacto vacíos", () => {
    const html = renderToStaticMarkup(
      <SiteFooter
        contact={{ hours: "Lun a Vie 9–18 hs" }}
        whatsappInquiryMessage=""
        legal={{ businessName: "Dietética Canelo", year: 2026 }}
      />
    );

    expect(html).toContain("Lun a Vie 9–18 hs");
    expect(html).not.toContain("site-footer-address");
    expect(html).not.toContain("mailto:");
  });
});
