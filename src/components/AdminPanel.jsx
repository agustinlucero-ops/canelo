import { Check, ChevronDown, Pencil, Trash2, Vegan, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchOrders } from "../api/orders";
import CollapsibleSection from "./CollapsibleSection";
import ProductEditModal from "./ProductEditModal";
import CatalogImportPanel from "./CatalogImportPanel";
import { formatPrice } from "../utils/whatsapp";

function formatPresentationsSummary(presentations) {
  return presentations.map((p) => `${p.label}: $${p.price}`).join(" · ");
}

function ProductListItem({ product, onStartEditProduct, onDeleteProduct, isActionDisabled }) {
  return (
    <li className="admin-product-list-item">
      <div className="admin-product-list-row">
        <div className="admin-product-list-info">
          <span className="admin-product-list-name">{product.name}</span>
          <span className="admin-product-list-meta">
            {formatPresentationsSummary(product.presentations)}
            {product.isVegan && (
              <>
                {" "}
                <span className="admin-product-list-badge" aria-label="Vegano">
                  <Vegan aria-hidden="true" />
                </span>
              </>
            )}
            {product.isKeto && (
              <>
                {" "}
                <span className="admin-product-list-badge" aria-label="Apto keto">
                  <img src="/images/keto-badge.svg" alt="" aria-hidden="true" />
                </span>
              </>
            )}
            {product.isGlutenFree && (
              <>
                {" "}
                <span className="admin-product-list-badge" aria-label="Sin TACC">
                  <img src="/images/gluten-free.svg" alt="" aria-hidden="true" />
                </span>
              </>
            )}
            {product.outOfStock && <span className="admin-product-list-stock">Sin stock</span>}
          </span>
        </div>
        <div className="admin-product-list-actions">
          <button
            className="admin-icon-button"
            type="button"
            onClick={() => onStartEditProduct(product)}
            aria-label={`Editar ${product.name}`}
            disabled={isActionDisabled}
          >
            <Pencil aria-hidden="true" />
          </button>
          <button
            className="admin-icon-button admin-icon-button-danger"
            type="button"
            onClick={() => onDeleteProduct(product.id)}
            aria-label={`Eliminar ${product.name}`}
            disabled={isActionDisabled}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function AdminPanel({
  allCategories,
  productCategoryOptions,
  categoryProductCount,
  adminGroupedProducts,
  expandedAdminCategories,
  onToggleAdminCategory,
  onExpandAllCategories,
  onCollapseAllCategories,
  isCategoryToolsOpen,
  onToggleCategoryTools,
  isAddProductOpen,
  onToggleAddProduct,
  newCategory,
  onNewCategoryChange,
  editingCategory,
  editingCategoryValue,
  onEditingCategoryValueChange,
  onAddCategory,
  categoryAdminError,
  onStartEditCategory,
  onSaveCategory,
  onCancelEditCategory,
  onDeleteCategory,
  newProductName,
  onNewProductNameChange,
  newProductCategory,
  onNewProductCategoryChange,
  newProductPresentation,
  onNewProductPresentationChange,
  newProductPrice,
  onNewProductPriceChange,
  newProductImage,
  onNewProductImageChange,
  newProductIsVegan,
  onNewProductIsVeganChange,
  newProductIsKeto,
  onNewProductIsKetoChange,
  newProductIsGlutenFree,
  onNewProductIsGlutenFreeChange,
  onNewProductImageFile,
  onAddProduct,
  productAdminError,
  adminPendingAction,
  isCatalogApiAvailable,
  editingProductId,
  editingProductDraft,
  onStartEditProduct,
  onEditProductField,
  onEditProductPresentationField,
  onAddPresentationToDraft,
  onRemovePresentationFromDraft,
  onEditProductImageFile,
  onEditVariantField,
  onAddVariantToDraft,
  onRemoveVariantFromDraft,
  onEditVariantImageFile,
  onSaveEditedProduct,
  onCancelEditProduct,
  onDeleteProduct,
  onLogout,
  normalizeCategoryName,
  onCatalogRefresh,
  onPendingChange,
}) {
  const isMutating = Boolean(adminPendingAction);
  const isReadOnly = !isCatalogApiAvailable;
  const isActionDisabled = isMutating || isReadOnly;
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    if (!isOrdersOpen) return undefined;

    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError("");

    fetchOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setOrdersError(err?.message || "No se pudieron cargar los pedidos.");
          setOrders([]);
        }
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOrdersOpen]);

  return (
    <section className="admin-section">
      <div className="admin-header">
        <h2>Gestión</h2>
        <button className="button" type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
      {isReadOnly && (
        <p className="admin-error">
          La API de catálogo no está disponible. La gestión está en modo solo lectura.
        </p>
      )}
      {isMutating && <p className="field-label">Guardando cambios...</p>}

      <CollapsibleSection
        title="Pedidos recientes"
        isOpen={isOrdersOpen}
        onToggle={() => setIsOrdersOpen((value) => !value)}
      >
        {ordersLoading && <p className="field-label">Cargando pedidos…</p>}
        {ordersError && <p className="admin-error">{ordersError}</p>}
        {!ordersLoading && !ordersError && orders.length === 0 && (
          <p className="field-label">Todavía no hay pedidos registrados.</p>
        )}
        {!ordersLoading && orders.length > 0 && (
          <ul className="admin-orders-list">
            {orders.map((order) => (
              <li key={order.id} className="admin-order-item">
                <div className="admin-order-header">
                  <strong>{formatPrice(order.total)}</strong>
                  <span>
                    {new Date(order.createdAt).toLocaleString("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className="admin-order-meta">
                  {order.customerName || "Sin nombre"}
                  {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                </p>
                <ul className="admin-order-lines">
                  {order.items.map((item, index) => (
                    <li key={`${order.id}-${index}`}>
                      {item.quantity}x {item.productName} ({item.presentationLabel}) —{" "}
                      {formatPrice(item.unitPrice * item.quantity)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CatalogImportPanel
        isActionDisabled={isActionDisabled}
        isCatalogApiAvailable={isCatalogApiAvailable}
        productCategoryOptions={productCategoryOptions}
        onCatalogRefresh={onCatalogRefresh}
        adminPendingAction={adminPendingAction}
        onPendingChange={onPendingChange}
      />

      <CollapsibleSection
        title="Categorías"
        isOpen={isCategoryToolsOpen}
        onToggle={onToggleCategoryTools}
      >
        <div className="category-admin-card">
          <form className="category-form" onSubmit={onAddCategory}>
            <input
              type="text"
              value={newCategory}
              onChange={(event) => onNewCategoryChange(event.target.value)}
              placeholder="Nueva categoría"
              disabled={isActionDisabled}
            />
            <button className="button primary" type="submit" disabled={isActionDisabled}>
              Agregar
            </button>
          </form>
          {categoryAdminError && <p className="admin-error">{categoryAdminError}</p>}

          <ul className="category-list">
            {allCategories.map((category) => (
              <li key={category} className="category-list-item">
                {editingCategory === category ? (
                  <div className="category-edit-grid">
                    <input
                      type="text"
                      value={editingCategoryValue}
                      onChange={(event) => onEditingCategoryValueChange(event.target.value)}
                      disabled={isActionDisabled}
                    />
                    <div className="category-item-actions">
                      <button
                        className="admin-icon-button admin-icon-button-primary"
                        type="button"
                        onClick={() => onSaveCategory(category)}
                        aria-label={`Guardar categoría ${category}`}
                        disabled={isActionDisabled}
                      >
                        <Check aria-hidden="true" />
                      </button>
                      <button
                        className="admin-icon-button"
                        type="button"
                        onClick={onCancelEditCategory}
                        aria-label="Cancelar edición"
                        disabled={isMutating}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="category-item-content">
                    <div className="category-item-main">
                      <span>{category}</span>
                      <small>
                        {categoryProductCount[normalizeCategoryName(category)] ?? 0} productos
                      </small>
                    </div>
                    <div className="category-item-actions">
                      <button
                        className="admin-icon-button"
                        type="button"
                        onClick={() => onStartEditCategory(category)}
                        aria-label={`Editar categoría ${category}`}
                        disabled={isActionDisabled}
                      >
                        <Pencil aria-hidden="true" />
                      </button>
                      <button
                        className="admin-icon-button admin-icon-button-danger"
                        type="button"
                        onClick={() => onDeleteCategory(category)}
                        aria-label={`Eliminar categoría ${category}`}
                        disabled={isActionDisabled}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Agregar producto"
        isOpen={isAddProductOpen}
        onToggle={onToggleAddProduct}
      >
        <form
          className="product-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onAddProduct();
          }}
        >
          <input
            type="text"
            value={newProductName}
            onChange={(event) => onNewProductNameChange(event.target.value)}
            placeholder="Nombre del producto"
            disabled={isActionDisabled}
          />
          <select
            className="select-field"
            value={newProductCategory}
            onChange={(event) => onNewProductCategoryChange(event.target.value)}
            disabled={isActionDisabled}
          >
            {productCategoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newProductPresentation}
            onChange={(event) => onNewProductPresentationChange(event.target.value)}
            placeholder="Presentación (ej. 500g)"
            disabled={isActionDisabled}
          />
          <input
            type="number"
            min="1"
            step="1"
            value={newProductPrice}
            onChange={(event) => onNewProductPriceChange(event.target.value)}
            placeholder="Precio"
            disabled={isActionDisabled}
          />
          <input
            type="text"
            value={newProductImage}
            onChange={(event) => onNewProductImageChange(event.target.value)}
            placeholder="Ruta o URL de foto (opcional)"
            disabled={isActionDisabled}
          />
          <input
            type="file"
            accept="image/*"
            onChange={onNewProductImageFile}
            disabled={isActionDisabled}
          />
          <label className="stock-toggle">
            <input
              type="checkbox"
              checked={newProductIsVegan}
              onChange={(event) => onNewProductIsVeganChange(event.target.checked)}
              disabled={isActionDisabled}
            />
            Producto vegano
          </label>
          <label className="stock-toggle">
            <input
              type="checkbox"
              checked={newProductIsKeto}
              onChange={(event) => onNewProductIsKetoChange(event.target.checked)}
              disabled={isActionDisabled}
            />
            Producto apto keto
          </label>
          <label className="stock-toggle">
            <input
              type="checkbox"
              checked={newProductIsGlutenFree}
              onChange={(event) => onNewProductIsGlutenFreeChange(event.target.checked)}
              disabled={isActionDisabled}
            />
            Producto sin TACC
          </label>
          <button className="button primary" type="submit" disabled={isActionDisabled}>
            Agregar producto
          </button>
        </form>
        {productAdminError && !editingProductDraft && (
          <p className="admin-error">{productAdminError}</p>
        )}
      </CollapsibleSection>

      <section className="admin-products-section">
        <div className="admin-products-header">
          <h3>Productos por categoría</h3>
          <div className="admin-products-header-actions">
            <button
              className="button button-sm"
              type="button"
              onClick={onExpandAllCategories}
              disabled={isMutating}
            >
              Expandir todo
            </button>
            <button
              className="button button-sm"
              type="button"
              onClick={onCollapseAllCategories}
              disabled={isMutating}
            >
              Colapsar todo
            </button>
          </div>
        </div>

        <div className="admin-category-groups">
          {adminGroupedProducts.map(([category, categoryProducts]) => {
            const isExpanded = expandedAdminCategories.has(category);
            const panelId = `admin-cat-${slugifyCategoryId(category)}`;

            return (
              <article key={category} className="admin-category-group">
                <button
                  type="button"
                  className="admin-category-group-trigger"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => onToggleAdminCategory(category)}
                >
                  <span className="admin-category-group-label">
                    <span className="admin-category-group-title">{category}</span>
                    <span className="admin-category-group-count">
                      {categoryProducts.length} producto{categoryProducts.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <ChevronDown
                    className={`collapsible-chevron admin-category-chevron ${isExpanded ? "is-open" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                <div
                  id={panelId}
                  className={`admin-category-group-panel ${isExpanded ? "is-open" : ""}`}
                  hidden={!isExpanded}
                >
                  <ul className="admin-product-list">
                    {categoryProducts.map((product) => (
                      <ProductListItem
                        key={product.id}
                        product={product}
                        onStartEditProduct={onStartEditProduct}
                        onDeleteProduct={onDeleteProduct}
                        isActionDisabled={isActionDisabled}
                      />
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {editingProductDraft && editingProductId && (
        <ProductEditModal
          draft={editingProductDraft}
          productCategoryOptions={productCategoryOptions}
          productAdminError={productAdminError}
          onClose={onCancelEditProduct}
          onSave={() => onSaveEditedProduct(editingProductId)}
          onEditProductField={onEditProductField}
          onEditProductPresentationField={onEditProductPresentationField}
          onAddPresentationToDraft={onAddPresentationToDraft}
          onRemovePresentationFromDraft={onRemovePresentationFromDraft}
          onEditProductImageFile={onEditProductImageFile}
          onEditVariantField={onEditVariantField}
          onAddVariantToDraft={onAddVariantToDraft}
          onRemoveVariantFromDraft={onRemoveVariantFromDraft}
          onEditVariantImageFile={onEditVariantImageFile}
          isActionDisabled={isActionDisabled}
          isSaving={isMutating}
        />
      )}
    </section>
  );
}

function slugifyCategoryId(category) {
  return category.replace(/\s+/g, "-").toLowerCase();
}
