import { X } from "lucide-react";
import { useState } from "react";
import { createOrder } from "../api/orders";
import { runWhatsAppCheckout } from "../utils/cartWhatsAppCheckout";
import { buildWhatsAppMessage, formatPrice, openWhatsAppLink } from "../utils/whatsapp";

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
  onSavePreviousCart,
  previousCartOffer,
  onRestorePreviousCart,
  onDismissPreviousCart,
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const handleWhatsAppCheckout = (event) => {
    event.preventDefault();

    const didCheckout = runWhatsAppCheckout({
      items,
      onSavePreviousCart,
      clearCart,
    });

    if (!didCheckout) {
      return;
    }

    const message = buildWhatsAppMessage({
      customerName,
      customerPhone,
      items,
      totals,
    });
    openWhatsAppLink({ phoneNumber: WHATSAPP_PHONE, message });

    void createOrder({
      customerName,
      customerPhone,
      items,
    }).catch((err) => {
      console.warn("[orders] No se pudo registrar el pedido:", err);
    });

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
          <div className="empty-state">
            <p>Todavia no agregaste productos.</p>
            {previousCartOffer && (
              <div className="previous-cart-offer" role="region" aria-label="Carrito anterior">
                <p>Tenés un carrito anterior.</p>
                <div className="previous-cart-offer-actions">
                  <button type="button" className="button primary" onClick={onRestorePreviousCart}>
                    Restaurar
                  </button>
                  <button type="button" className="button" onClick={onDismissPreviousCart}>
                    Descartar
                  </button>
                </div>
              </div>
            )}
          </div>
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
                Direccion
              </label>
              <input
                id="customer-phone"
                type="text"
                placeholder="En caso de envío"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
              />

              <button
                type="button"
                className={`button whatsapp ${items.length ? "" : "disabled"}`.trim()}
                disabled={!items.length}
                onClick={handleWhatsAppCheckout}
              >
                Enviar pedido por WhatsApp
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
