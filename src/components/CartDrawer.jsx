import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { buildWhatsAppLink, buildWhatsAppMessage, formatPrice } from "../utils/whatsapp";

const STORE_NAME = "Dietetica Canelo";
const WHATSAPP_PHONE =
  import.meta.env.VITE_WHATSAPP_PHONE?.replace(/\D/g, "") || "5491122334455";

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  totals,
  setQuantity,
  removeItem,
  clearCart,
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const checkoutLink = useMemo(() => {
    if (!items.length) {
      return "";
    }

    const message = buildWhatsAppMessage({
      storeName: STORE_NAME,
      customerName,
      customerPhone,
      items,
      totals,
    });

    return buildWhatsAppLink({ phoneNumber: WHATSAPP_PHONE, message });
  }, [customerName, customerPhone, items, totals]);

  const handleWhatsAppCheckout = (event) => {
    if (!items.length || !checkoutLink) {
      event.preventDefault();
      return;
    }

    clearCart();
    setCustomerName("");
    setCustomerPhone("");
    onClose();
  };

  return (
    <>
      {isOpen && <button aria-label="Cerrar carrito" className="overlay" onClick={onClose} />}
      <aside className={`cart-drawer ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
        <header className="cart-header">
          <h2>Tu carrito</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X aria-hidden="true" />
          </button>
        </header>

        {items.length === 0 ? (
          <p className="empty-state">Todavia no agregaste productos.</p>
        ) : (
          <>
            <ul className="cart-list">
              {items.map((item) => (
                <li key={item.key} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-main">
                    <strong>{item.name}</strong>
                    <span>{item.presentation}</span>
                    <span>{formatPrice(item.unitPrice)} c/u</span>
                  </div>

                  <div className="cart-item-actions">
                    <label htmlFor={`qty-${item.key}`} className="field-label">
                      Cant.
                    </label>
                    <div className="quantity-stepper">
                      <button
                        type="button"
                        className="quantity-stepper-button"
                        aria-label={`Restar una unidad de ${item.name}`}
                        onClick={() => setQuantity(item.key, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <input id={`qty-${item.key}`} type="text" value={item.quantity} readOnly />
                      <button
                        type="button"
                        className="quantity-stepper-button"
                        aria-label={`Sumar una unidad de ${item.name}`}
                        onClick={() => setQuantity(item.key, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button className="text-button" onClick={() => removeItem(item.key)}>
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(totals.subtotal)}</strong>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <strong>{formatPrice(totals.total)}</strong>
              </div>
            </div>

            <div className="checkout-form">
              <label htmlFor="customer-name" className="field-label">
                Nombre
              </label>
              <input
                id="customer-name"
                type="text"
                placeholder="Tu nombre"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />

              <label htmlFor="customer-phone" className="field-label">
                Telefono
              </label>
              <input
                id="customer-phone"
                type="tel"
                placeholder="11 5555 5555"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
              />

              <a
                href={checkoutLink || "#"}
                target="_blank"
                rel="noreferrer"
                className={`button whatsapp ${items.length ? "" : "disabled"}`.trim()}
                onClick={handleWhatsAppCheckout}
              >
                Enviar pedido por WhatsApp
              </a>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
