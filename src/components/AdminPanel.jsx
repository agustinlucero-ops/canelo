import { Check, ChevronDown, Pencil, Trash2, Vegan, X } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import ProductEditModal from "./ProductEditModal";

function formatPresentationsSummary(presentations) {
  return presentations.map((p) => `${p.label}: $${p.price}`).join(" · ");
}

function ProductListItem({ product, onStartEditProduct, onDeleteProduct }) {
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
          >
            <Pencil aria-hidden="true" />
          </button>
          <button
            className="admin-icon-button admin-icon-button-danger"
            type="button"
            onClick={() => onDeleteProduct(product.id)}
            aria-label={`Eliminar ${product.name}`}
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
  editingProductId,
  editingProductDraft,
  onStartEditProduct,
  onEditProductField,
  onEditProductPresentationField,
  onAddPresentationToDraft,
  onRemovePresentationFromDraft,
  onEditProductImageFile,
  onSaveEditedProduct,
  onCancelEditProduct,
  onDeleteProduct,
  onLogout,
  normalizeCategoryName,
}) {
  return (
    <section className="admin-section">
      <div className="admin-header">
        <h2>Gestión</h2>
        <button className="button" type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>

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
            />
            <button className="button primary" type="submit">
              Agregar
            </button>
          </form>

          <ul className="category-list">
            {allCategories.map((category) => (
              <li key={category} className="category-list-item">
                {editingCategory === category ? (
                  <div className="category-edit-grid">
                    <input
                      type="text"
                      value={editingCategoryValue}
                      onChange={(event) => onEditingCategoryValueChange(event.target.value)}
                    />
                    <div className="category-item-actions">
                      <button
                        className="admin-icon-button admin-icon-button-primary"
                        type="button"
                        onClick={() => onSaveCategory(category)}
                        aria-label={`Guardar categoría ${category}`}
                      >
                        <Check aria-hidden="true" />
                      </button>
                      <button
                        className="admin-icon-button"
                        type="button"
                        onClick={onCancelEditCategory}
                        aria-label="Cancelar edición"
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
                      >
                        <Pencil aria-hidden="true" />
                      </button>
                      <button
                        className="admin-icon-button admin-icon-button-danger"
                        type="button"
                        onClick={() => onDeleteCategory(category)}
                        aria-label={`Eliminar categoría ${category}`}
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
          />
          <select
            className="select-field"
            value={newProductCategory}
            onChange={(event) => onNewProductCategoryChange(event.target.value)}
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
          />
          <input
            type="number"
            min="1"
            step="1"
            value={newProductPrice}
            onChange={(event) => onNewProductPriceChange(event.target.value)}
            placeholder="Precio"
          />
          <input
            type="url"
            value={newProductImage}
            onChange={(event) => onNewProductImageChange(event.target.value)}
            placeholder="URL de foto (opcional)"
          />
          <input type="file" accept="image/*" onChange={onNewProductImageFile} />
          <label className="stock-toggle">
            <input
              type="checkbox"
              checked={newProductIsVegan}
              onChange={(event) => onNewProductIsVeganChange(event.target.checked)}
            />
            Producto vegano
          </label>
          <label className="stock-toggle">
            <input
              type="checkbox"
              checked={newProductIsKeto}
              onChange={(event) => onNewProductIsKetoChange(event.target.checked)}
            />
            Producto apto keto
          </label>
          <label className="stock-toggle">
            <input
              type="checkbox"
              checked={newProductIsGlutenFree}
              onChange={(event) => onNewProductIsGlutenFreeChange(event.target.checked)}
            />
            Producto sin TACC
          </label>
          <button className="button primary" type="submit">
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
            <button className="button button-sm" type="button" onClick={onExpandAllCategories}>
              Expandir todo
            </button>
            <button className="button button-sm" type="button" onClick={onCollapseAllCategories}>
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
        />
      )}
    </section>
  );
}

function slugifyCategoryId(category) {
  return category.replace(/\s+/g, "-").toLowerCase();
}
