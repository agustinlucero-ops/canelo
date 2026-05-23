import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTimedNotice } from "./timedNotice";

describe("createTimedNotice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra la confirmación y la oculta sola después del tiempo configurado", () => {
    const onShow = vi.fn();
    const onHide = vi.fn();
    const notice = createTimedNotice({ onShow, onHide, delayMs: 2500 });

    notice.show("¡Agregado al carrito! 🛒");

    expect(onShow).toHaveBeenCalledWith("¡Agregado al carrito! 🛒");
    expect(onHide).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2500);

    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("reinicia el temporizador si se muestra otra confirmación seguida", () => {
    const onShow = vi.fn();
    const onHide = vi.fn();
    const notice = createTimedNotice({ onShow, onHide, delayMs: 2500 });

    notice.show("Primero");
    vi.advanceTimersByTime(2000);
    notice.show("Segundo");

    expect(onShow).toHaveBeenLastCalledWith("Segundo");
    expect(onHide).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2500);

    expect(onHide).toHaveBeenCalledTimes(1);
  });
});
