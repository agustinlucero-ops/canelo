import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ExitConfirmDialog from "./ExitConfirmDialog";

describe("ExitConfirmDialog", () => {
  it("muestra el mensaje acordado de confirmación de salida", () => {
    const html = renderToStaticMarkup(
      <ExitConfirmDialog isOpen onStay={vi.fn()} onLeave={vi.fn()} />
    );

    expect(html).toContain("¿Querés salir de la tienda? Tu carrito todavía tiene productos.");
    expect(html).toContain("Seguir comprando");
    expect(html).toContain("Salir");
  });
});
