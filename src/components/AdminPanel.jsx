import { Check, ChevronDown, ChevronUp, Pencil, Trash2, Vegan, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchOrders } from "../api/orders";
import CollapsibleSection from "./CollapsibleSection";
import ProductEditModal from "./ProductEditModal";
import CatalogImportPanel from "./CatalogImportPanel";
import AdminPresentationsFields from "./AdminPresentationsFields";
import AdminVariantsFields from "./AdminVariantsFields";
import { productHasFlavorVariants } from "../utils/sanitizeCatalog";
import { formatAdminPresentationsSummary } from "../utils/adminPromo";
import { formatPrice } from "../utils/whatsapp";
import AdminPromoTools from "./AdminPromoTools";


function ProductListItem({ product, onStartEditProduct, onDeleteProduct, isActionDisabled }) {
  return (
    <li className="admin-product-list-item">
      <div className="admin-product-list-row">
        <div className="admin-product-list-info">
          <span className="admin-product-list-name">{product.name}</span>
          <span className="admin-product-list-meta">
            {formatAdminPresentationsSummary(product.presentations)}
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

function CategoryAdminRow({
  category,
  categoryProductCount,
  normalizeCategoryName,
  editingCategory,
  editingCategoryValue,
  onEditingCategoryValueChange,
  onSaveCategory,
  onCancelEditCategory,
  onStartEditCategory,
  onDeleteCategory,
  isActionDisabled,
  isMutating,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  showReorder,
  showEdit,
}) {
  if (editingCategory === category) {
    return (
      <li className="category-list-item">
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
      </li>
    );
  }

  return (
    <li className="category-list-item">
      <div className="category-item-content">
        <div className="category-item-main">
          <span>{category}</span>
          <small>
            {categoryProductCount[normalizeCategoryName(category)] ?? 0} productos
          </small>
        </div>
        <div className="category-item-actions">
          {showReorder && (
            <>
              <button
                className="admin-icon-button"
                type="button"
                onClick={onMoveUp}
                aria-label={`Subir categoría ${category}`}
                disabled={isActionDisabled || !canMoveUp}
              >
                <ChevronUp aria-hidden="true" />
              </button>
              <button
                className="admin-icon-button"
                type="button"
                onClick={onMoveDown}
                aria-label={`Bajar categoría ${category}`}
                disabled={isActionDisabled || !canMoveDown}
              >
                <ChevronDown aria-hidden="true" />
              </button>
            </>
          )}
          {showEdit && (
            <>
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
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export default function AdminPanel({
  allCategories,
  storeFilterCategories,
  shelfCategories,
  onMoveShelfCategory,
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
  isPromoToolsOpen,
  onTogglePromoTools,
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
  newProductShelfNote,
  onNewProductShelfNoteChange,
  newProductType,
  onNewProductTypeChange,
  newProductCategory,
  onNewProductCategoryChange,
  newProductPresentations,
  onNewProductPresentationChange,
  onAddNewProductPresentation,
  onRemoveNewProductPresentation,
  newProductVariants,
  onNewProductVariantChange,
  onAddNewProductVariant,
  onRemoveNewProductVariant,
  onNewProductVariantImageFile,
  onClearNewProductVariantImage,
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

          {storeFilterCategories.length > 0 && (
            <div className="category-admin-block">
              <h3 className="category-admin-block-title">Filtros de tienda</h3>
              <p className="category-admin-block-hint">
                Siempre aparecen primero en el catálogo. No se reordenan.
              </p>
              <ul className="category-list">
                {storeFilterCategories.map((category) => (
                  <CategoryAdminRow
                    key={category}
                    category={category}
                    categoryProductCount={categoryProductCount}
                    normalizeCategoryName={normalizeCategoryName}
                    editingCategory={editingCategory}
                    editingCategoryValue={editingCategoryValue}
                    onEditingCategoryValueChange={onEditingCategoryValueChange}
                    onSaveCategory={onSaveCategory}
                    onCancelEditCategory={onCancelEditCategory}
                    onStartEditCategory={onStartEditCategory}
                    onDeleteCategory={onDeleteCategory}
                    isActionDisabled={isActionDisabled}
                    isMutating={isMutating}
                    showReorder={false}
                    showEdit={false}
                  />
                ))}
              </ul>
            </div>
          )}

          <div className="category-admin-block">
            <h3 className="category-admin-block-title">Categorías de estante</h3>
            <p className="category-admin-block-hint">
              Orden en el catálogo cuando el cliente ve «Todas».
            </p>
            <ul className="category-list">
              {shelfCategories.map((category, index) => (
                <CategoryAdminRow
                  key={category}
                  category={category}
                  categoryProductCount={categoryProductCount}
                  normalizeCategoryName={normalizeCategoryName}
                  editingCategory={editingCategory}
                  editingCategoryValue={editingCategoryValue}
                  onEditingCategoryValueChange={onEditingCategoryValueChange}
                  onSaveCategory={onSaveCategory}
                  onCancelEditCategory={onCancelEditCategory}
                  onStartEditCategory={onStartEditCategory}
                  onDeleteCategory={onDeleteCategory}
                  isActionDisabled={isActionDisabled}
                  isMutating={isMutating}
                  showReorder
                  showEdit
                  canMoveUp={index > 0}
                  canMoveDown={index < shelfCategories.length - 1}
                  onMoveUp={() => onMoveShelfCategory(category, -1)}
                  onMoveDown={() => onMoveShelfCategory(category, 1)}
                />
              ))}
            </ul>
          </div>
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
          {newProductType === "simple" && (
            <>
              <label className="field-label" htmlFor="new-product-shelf-note">
                Aclaración (opcional)
              </label>
              <input
                id="new-product-shelf-note"
                type="text"
                value={newProductShelfNote}
                onChange={(event) => onNewProductShelfNoteChange(event.target.value)}
                placeholder="ej. sin piel, orgánico"
                maxLength={50}
                disabled={isActionDisabled}
              />
            </>
          )}
          <label className="field-label" htmlFor="new-product-type">
            Tipo de producto
          </label>
          <select
            id="new-product-type"
            className="select-field"
            value={newProductType}
            onChange={(event) => onNewProductTypeChange(event.target.value)}
            disabled={isActionDisabled}
          >
            <option value="simple">Producto simple</option>
            <option value="flavor-line">Línea de producto (granola)</option>
            <option value="flavored">Producto con sabores (maní)</option>
          </select>
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
          <AdminPresentationsFields
            presentations={newProductPresentations}
            onPresentationChange={onNewProductPresentationChange}
            onAddPresentation={onAddNewProductPresentation}
            onRemovePresentation={onRemoveNewProductPresentation}
            disabled={isActionDisabled}
            heading={
              productHasFlavorVariants(newProductType)
                ? "Presentaciones y precios (compartidas por sabores)"
                : "Presentaciones y precios"
            }
          />
          <p className="field-label">Foto de línea</p>
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
          {productHasFlavorVariants(newProductType) && (
            <AdminVariantsFields
              variants={newProductVariants}
              productType={newProductType}
              lineImage={newProductImage}
              onVariantChange={onNewProductVariantChange}
              onVariantImageFile={onNewProductVariantImageFile}
              onClearVariantImage={onClearNewProductVariantImage}
              onAddVariant={onAddNewProductVariant}
              onRemoveVariant={onRemoveNewProductVariant}
              disabled={isActionDisabled}
            />
          )}
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

      <CollapsibleSection
        title="Aplicar descuento"
        isOpen={isPromoToolsOpen}
        onToggle={onTogglePromoTools}
      >
        <AdminPromoTools
          promoProduct={promoProduct}
          promoSearchValue={promoSearchValue}
          onPromoSearchChange={onPromoSearchChange}
          promoSearchOpen={promoSearchOpen}
          onPromoSearchOpenChange={onPromoSearchOpenChange}
          promoSearchProducts={promoSearchProducts}
          promoSearchShowNoMatches={promoSearchShowNoMatches}
          onSelectPromoProduct={onSelectPromoProduct}
          promoPresentationLabel={promoPresentationLabel}
          onPromoPresentationLabelChange={onPromoPresentationLabelChange}
          promoDiscountValue={promoDiscountValue}
          onPromoDiscountChange={onPromoDiscountChange}
          promoAdminError={promoAdminError}
          promoSuccessMessage={promoSuccessMessage}
          onApplyPromo={onApplyPromo}
          onRemovePromo={onRemovePromo}
          isActionDisabled={isActionDisabled}
        />
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
