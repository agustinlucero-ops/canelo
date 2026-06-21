import AdminProductSearch from "./AdminProductSearch";
import { formatPrice } from "../utils/whatsapp";
import { resolvePresentationPricing } from "../utils/presentationPricing";
import {
  getPromoDiscountDraftValue,
  shouldShowPromoPresentationSelector,
} from "../utils/adminPromo";

export default function AdminPromoTools({
  promoProduct,
  promoSearchValue,
  onPromoSearchChange,
  promoSearchOpen,
  onPromoSearchOpenChange,
  promoSearchProducts,
  promoSearchShowNoMatches,
  onSelectPromoProduct,
  promoPresentationLabel,
  onPromoPresentationLabelChange,
  promoDiscountValue,
  onPromoDiscountChange,
  promoAdminError,
  promoSuccessMessage,
  onApplyPromo,
  onRemovePromo,
  isActionDisabled,
}) {
  const selectedPresentation =
    promoProduct?.presentations?.find(
      (presentation) => presentation.label === promoPresentationLabel
    ) ?? promoProduct?.presentations?.[0] ?? null;
  const pricing = selectedPresentation ? resolvePresentationPricing(selectedPresentation) : null;
  const showPresentationSelector = shouldShowPromoPresentationSelector(promoProduct?.presentations);

  return (
    <div className="admin-promo-tools">
      <AdminProductSearch
        searchValue={promoSearchValue}
        onSearchChange={onPromoSearchChange}
        isOpen={promoSearchOpen}
        onOpenChange={onPromoSearchOpenChange}
        products={promoSearchProducts}
        showNoMatches={promoSearchShowNoMatches}
        onSelectProduct={onSelectPromoProduct}
      />

      {promoProduct && (
        <div className="admin-promo-form">
          <p className="field-label">Producto seleccionado: {promoProduct.name}</p>

          {showPresentationSelector && (
            <>
              <label className="field-label" htmlFor="admin-promo-presentation">
                Presentación
              </label>
              <select
                id="admin-promo-presentation"
                className="select-field"
                value={promoPresentationLabel}
                onChange={(event) => onPromoPresentationLabelChange(event.target.value)}
                disabled={isActionDisabled}
              >
                {promoProduct.presentations.map((presentation) => (
                  <option key={presentation.label} value={presentation.label}>
                    {presentation.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <label className="field-label" htmlFor="admin-promo-discount">
            Descuento (%)
          </label>
          <input
            id="admin-promo-discount"
            className="select-field"
            type="number"
            min="1"
            max="99"
            step="1"
            value={promoDiscountValue}
            onChange={(event) => onPromoDiscountChange(event.target.value)}
            placeholder="ej. 10"
            disabled={isActionDisabled}
          />

          {pricing && (
            <p className="field-label">
              {pricing.hasDiscount
                ? `Promo activa — precio de venta ${formatPrice(pricing.salePrice)}`
                : "Sin promo activa"}
            </p>
          )}

          <div className="admin-promo-actions">
            <button
              className="button primary"
              type="button"
              onClick={onApplyPromo}
              disabled={isActionDisabled}
            >
              Aplicar
            </button>
            <button
              className="button"
              type="button"
              onClick={onRemovePromo}
              disabled={isActionDisabled || !pricing?.hasDiscount}
            >
              Quitar promo
            </button>
          </div>
        </div>
      )}

      {promoAdminError && <p className="admin-error">{promoAdminError}</p>}
      {promoSuccessMessage && !promoAdminError && (
        <p className="field-label">{promoSuccessMessage}</p>
      )}
    </div>
  );
}

export function getPromoStateForProduct(product, presentationLabel) {
  const label =
    presentationLabel ||
    product?.presentations?.[0]?.label ||
    "";
  const presentation =
    product?.presentations?.find((entry) => entry.label === label) ??
    product?.presentations?.[0] ??
    null;

  return {
    presentationLabel: label,
    discountValue: getPromoDiscountDraftValue(presentation),
  };
}
