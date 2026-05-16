import { ShoppingCart, Vegan } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "./components/ProductCard";
import CartDrawer from "./components/CartDrawer";
import { useCart } from "./context/CartContext";
import initialProducts from "./data/products.json";
import { normalizeProductName } from "./utils/productName";
import {
  VEGAN_FILTER_CATEGORY,
  getProductCategoryOptions,
  isVeganFilterCategory,
  resolveProductCategoryAndVegan,
} from "./utils/productCategories";

const CATEGORIES_STORAGE_KEY = "canelo.categories";
const PRODUCTS_STORAGE_KEY = "canelo.products";
const PRODUCTS_VERSION_STORAGE_KEY = "canelo.products-version";
const PRODUCTS_DATA_VERSION = 8;
const ADMIN_SESSION_STORAGE_KEY = "canelo.admin-session";
const ADMIN_USER = "dieteticacanelo@gmail.com";
const ADMIN_PASSWORD = "TagaBodoque";
const DEFAULT_PRODUCT_IMAGE = "/images/products/almendra.svg";

const DEFAULT_CATEGORIES = [
  "Sin tacc",
  "Granolas",
  "Apto keto",
  "Cereales",
  "Condimentos",
  "Congelados",
  "Aceites",
  "Pastas de mani",
  "Frutos secos",
  "Veganos",
  "Harinas y legumbres"
];

const normalizeCategoryName = (value) => value.trim().replace(/\s+/g, " ");
const normalizeCategoryLabel = (value) => {
  const normalizedValue = normalizeCategoryName(value || "");
  return normalizedValue.toLowerCase() === "ceriales" ? "Cereales" : normalizedValue;
};
const normalizePriceValue = (value) => Number(String(value).replace(",", "."));
const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const sanitizePresentations = (presentations) => {
  if (!Array.isArray(presentations)) return [];

  return presentations
    .map((presentation) => {
      const label = String(presentation?.label ?? "").trim();
      const price = Number(presentation?.price);
      if (!label || Number.isNaN(price) || price <= 0) return null;
      return {
        label,
        price: Math.round(price),
      };
    })
    .filter(Boolean);
};

const sanitizeProducts = (productList) => {
  if (!Array.isArray(productList)) return [];

  return productList
    .map((product, index) => {
      const id = String(product?.id ?? "").trim() || `producto-${index + 1}`;
      const normalizedCategory =
        normalizeCategoryLabel(String(product?.category ?? "").trim()) || "Sin tacc";
      const { category, isVegan } = resolveProductCategoryAndVegan(product, normalizedCategory);
      const name = normalizeProductName(String(product?.name ?? "").trim(), category);
      const image = String(product?.image ?? "").trim() || DEFAULT_PRODUCT_IMAGE;
      const presentations = sanitizePresentations(product?.presentations);
      if (!name || !presentations.length) return null;

      return {
        ...product,
        id,
        name,
        category,
        image,
        presentations,
        isVegan,
        outOfStock: Boolean(product?.outOfStock),
      };
    })
    .filter(Boolean);
};

function loadStoredData(storageKey, fallback) {
  if (typeof window === "undefined") return fallback;
  const storedValue = window.localStorage.getItem(storageKey);
  if (!storedValue) return fallback;

  try {
    return JSON.parse(storedValue);
  } catch {
    return fallback;
  }
}

export default function App() {
  const [isCartOpen, setCartOpen] = useState(false);
  const { items, totals, addItem, setQuantity, removeItem } = useCart();
  const [products, setProducts] = useState(() => {
    const fallbackProducts = sanitizeProducts(initialProducts);
    const storedVersion = loadStoredData(PRODUCTS_VERSION_STORAGE_KEY, 0);
    if (storedVersion !== PRODUCTS_DATA_VERSION) {
      return fallbackProducts;
    }
    const storedProducts = loadStoredData(PRODUCTS_STORAGE_KEY, fallbackProducts);
    const sanitizedStoredProducts = sanitizeProducts(storedProducts);
    return sanitizedStoredProducts.length ? sanitizedStoredProducts : fallbackProducts;
  });
  const [categories, setCategories] = useState(() => {
    const storedCategories = loadStoredData(CATEGORIES_STORAGE_KEY, DEFAULT_CATEGORIES);
    if (!Array.isArray(storedCategories) || !storedCategories.length) {
      return DEFAULT_CATEGORIES;
    }

    return [...new Set(storedCategories.map((category) => normalizeCategoryLabel(category)).filter(Boolean))];
  });
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategorySuggestionsOpen, setIsCategorySuggestionsOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminUserInput, setAdminUserInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdmin, setIsAdmin] = useState(() =>
    loadStoredData(ADMIN_SESSION_STORAGE_KEY, false)
  );
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Sin tacc");
  const [newProductPresentation, setNewProductPresentation] = useState("1kg");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductIsVegan, setNewProductIsVegan] = useState(false);
  const [newProductImage, setNewProductImage] = useState("");
  const [productAdminError, setProductAdminError] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProductDraft, setEditingProductDraft] = useState(null);

  useEffect(() => {
    setProducts((currentProducts) => {
      const sanitizedProducts = sanitizeProducts(currentProducts);
      const hasNameChanges = sanitizedProducts.some((product) => {
        const currentProduct = currentProducts.find((item) => item.id === product.id);
        return currentProduct && currentProduct.name !== product.name;
      });
      return hasNameChanges ? sanitizedProducts : currentProducts;
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    window.localStorage.setItem(
      PRODUCTS_VERSION_STORAGE_KEY,
      JSON.stringify(PRODUCTS_DATA_VERSION)
    );
  }, [products]);

  useEffect(() => {
    window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(isAdmin));
  }, [isAdmin]);

  const allCategories = useMemo(() => {
    const categoriesWithProducts = products
      .map((product) => product.category)
      .filter(Boolean);
    return [...new Set([...categories, ...categoriesWithProducts])];
  }, [categories, products]);

  const productCategoryOptions = useMemo(
    () => getProductCategoryOptions(allCategories),
    [allCategories]
  );

  useEffect(() => {
    if (selectedCategory !== "Todas" && !allCategories.includes(selectedCategory)) {
      setSelectedCategory("Todas");
      setCategorySearch("");
    }
  }, [allCategories, selectedCategory]);

  const visibleProducts = useMemo(() => {
    if (selectedCategory === "Todas") return products;
    if (isVeganFilterCategory(selectedCategory)) {
      return products.filter((product) => product.isVegan);
    }
    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const groupedProducts = useMemo(() => {
    const grouped = visibleProducts.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([categoryA], [categoryB]) => {
      const indexA = allCategories.indexOf(categoryA);
      const indexB = allCategories.indexOf(categoryB);

      if (indexA === -1 || indexB === -1) {
        return categoryA.localeCompare(categoryB, "es");
      }

      return indexA - indexB;
    });
  }, [allCategories, visibleProducts]);

  const filteredCategorySuggestions = useMemo(() => {
    const normalizedSearch = categorySearch.trim().toLowerCase();
    if (!normalizedSearch) return allCategories;

    return allCategories.filter((category) =>
      category.toLowerCase().includes(normalizedSearch)
    );
  }, [allCategories, categorySearch]);

  const categoryProductCount = useMemo(() => {
    return products.reduce((acc, product) => {
      const normalizedCategory = normalizeCategoryName(product.category || "Sin tacc");
      acc[normalizedCategory] = (acc[normalizedCategory] ?? 0) + 1;
      if (product.isVegan) {
        acc[VEGAN_FILTER_CATEGORY] = (acc[VEGAN_FILTER_CATEGORY] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [products]);

  const handleAddCategory = (event) => {
    event.preventDefault();
    const normalizedName = normalizeCategoryLabel(newCategory);
    if (!normalizedName) return;

    const alreadyExists = allCategories.some(
      (category) => category.toLowerCase() === normalizedName.toLowerCase()
    );

    if (alreadyExists) return;

    setCategories((currentCategories) => [...currentCategories, normalizedName]);
    setNewCategory("");
  };

  const handleStartEditCategory = (category) => {
    setEditingCategory(category);
    setEditingCategoryValue(category);
  };

  const handleSaveCategory = (previousCategory) => {
    const normalizedName = normalizeCategoryLabel(editingCategoryValue);
    if (!normalizedName) return;

    const alreadyExists = allCategories.some(
      (category) =>
        category.toLowerCase() === normalizedName.toLowerCase() &&
        category.toLowerCase() !== previousCategory.toLowerCase()
    );

    if (alreadyExists) return;

    setCategories((currentCategories) =>
      currentCategories.map((category) =>
        category === previousCategory ? normalizedName : category
      )
    );

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.category === previousCategory
          ? { ...product, category: normalizedName }
          : product
      )
    );

    if (selectedCategory === previousCategory) {
      setSelectedCategory(normalizedName);
    }

    setEditingCategory(null);
    setEditingCategoryValue("");
  };

  const handleDeleteCategory = (categoryToDelete) => {
    const shouldDelete = window.confirm(
      `Se va a eliminar la categoría "${categoryToDelete}". Los productos pasarán a "Sin tacc".`
    );

    if (!shouldDelete) return;

    setCategories((currentCategories) =>
      currentCategories.filter((category) => category !== categoryToDelete)
    );

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.category === categoryToDelete ? { ...product, category: "Sin tacc" } : product
      )
    );

    if (selectedCategory === categoryToDelete) {
      setSelectedCategory("Todas");
    }
  };

  const handleNewProductImageFile = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setProductAdminError("La foto debe ser un archivo de imagen.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewProductImage(String(reader.result));
      setProductAdminError("");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleAddProduct = () => {

    const normalizedName = newProductName.trim();
    const normalizedCategory = normalizeCategoryName(newProductCategory || "");
    const normalizedPresentation = newProductPresentation.trim();
    const normalizedPrice = normalizePriceValue(newProductPrice);

    if (!normalizedName) {
      setProductAdminError("Completá el nombre del producto.");
      return;
    }

    if (!normalizedCategory) {
      setProductAdminError("Seleccioná una categoría para el producto.");
      return;
    }

    if (isVeganFilterCategory(normalizedCategory)) {
      setProductAdminError(
        'Elegí el tipo de producto, no "Veganos". Marcá "Producto vegano" si corresponde.'
      );
      return;
    }

    const categoryExists = allCategories.some(
      (category) => category.toLowerCase() === normalizedCategory.toLowerCase()
    );
    if (!categoryExists) {
      setProductAdminError("La categoría no existe. Creala primero en el bloque de Categorías.");
      return;
    }

    if (!normalizedPresentation || Number.isNaN(normalizedPrice) || normalizedPrice <= 0) {
      setProductAdminError("Completá una presentación y precio válido.");
      return;
    }

    const generatedBase = slugify(normalizedName) || "producto";
    const existingIds = new Set(products.map((product) => product.id));
    let generatedId = generatedBase;
    let suffix = 2;
    while (existingIds.has(generatedId)) {
      generatedId = `${generatedBase}-${suffix}`;
      suffix += 1;
    }

    const nextProduct = {
      id: generatedId,
      name: normalizedName,
      category: normalizedCategory,
      image: newProductImage.trim() || DEFAULT_PRODUCT_IMAGE,
      isVegan: newProductIsVegan,
      outOfStock: false,
      presentations: [
        {
          label: normalizedPresentation,
          price: Math.round(normalizedPrice),
        },
      ],
    };

    setProducts((currentProducts) => [...currentProducts, nextProduct]);
    setNewProductName("");
    setNewProductCategory("Sin tacc");
    setNewProductIsVegan(false);
    setNewProductPresentation("1kg");
    setNewProductPrice("");
    setNewProductImage("");
    setProductAdminError("");
  };

  const handleDeleteProduct = (productId) => {
    const targetProduct = products.find((product) => product.id === productId);
    if (!targetProduct) return;

    const shouldDelete = window.confirm(
      `Se va a eliminar el producto "${targetProduct.name}". Esta acción no se puede deshacer.`
    );
    if (!shouldDelete) return;

    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== productId)
    );

    if (editingProductId === productId) {
      setEditingProductId(null);
      setEditingProductDraft(null);
    }
  };

  const handleStartEditProduct = (product) => {
    setEditingProductId(product.id);
    setEditingProductDraft({
      id: product.id,
      name: product.name,
      category: product.category,
      image: product.image,
      isVegan: Boolean(product.isVegan),
      outOfStock: Boolean(product.outOfStock),
      presentations: product.presentations.map((presentation) => ({
        label: presentation.label,
        price: String(presentation.price),
      })),
    });
    setProductAdminError("");
  };

  const handleEditProductField = (field, value) => {
    setEditingProductDraft((currentDraft) =>
      currentDraft
        ? {
            ...currentDraft,
            [field]: value,
          }
        : currentDraft
    );
  };

  const handleEditProductPresentationField = (index, field, value) => {
    setEditingProductDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;
      return {
        ...currentDraft,
        presentations: currentDraft.presentations.map((presentation, presentationIndex) =>
          presentationIndex === index
            ? {
                ...presentation,
                [field]: value,
              }
            : presentation
        ),
      };
    });
  };

  const handleAddPresentationToDraft = () => {
    setEditingProductDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;
      return {
        ...currentDraft,
        presentations: [...currentDraft.presentations, { label: "", price: "" }],
      };
    });
  };

  const handleRemovePresentationFromDraft = (index) => {
    setEditingProductDraft((currentDraft) => {
      if (!currentDraft || currentDraft.presentations.length === 1) return currentDraft;
      return {
        ...currentDraft,
        presentations: currentDraft.presentations.filter(
          (_, presentationIndex) => presentationIndex !== index
        ),
      };
    });
  };

  const handleEditProductImageFile = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setProductAdminError("La foto debe ser un archivo de imagen.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditingProductDraft((currentDraft) =>
        currentDraft
          ? {
              ...currentDraft,
              image: String(reader.result),
            }
          : currentDraft
      );
      setProductAdminError("");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSaveEditedProduct = (productId) => {
    if (!editingProductDraft || editingProductDraft.id !== productId) return;

    const normalizedName = editingProductDraft.name.trim();
    const normalizedCategory = normalizeCategoryName(editingProductDraft.category || "");
    const sanitizedPresentations = editingProductDraft.presentations
      .map((presentation) => ({
        label: presentation.label.trim(),
        price: normalizePriceValue(presentation.price),
      }))
      .filter((presentation) => presentation.label && presentation.price > 0);

    if (!normalizedName) {
      setProductAdminError("El producto debe tener nombre.");
      return;
    }

    if (!normalizedCategory) {
      setProductAdminError("Seleccioná una categoría válida para el producto.");
      return;
    }

    if (isVeganFilterCategory(normalizedCategory)) {
      setProductAdminError(
        'Elegí el tipo de producto, no "Veganos". Marcá "Producto vegano" si corresponde.'
      );
      return;
    }

    const categoryExists = allCategories.some(
      (category) => category.toLowerCase() === normalizedCategory.toLowerCase()
    );
    if (!categoryExists) {
      setProductAdminError("La categoría no existe. Creala primero en el bloque de Categorías.");
      return;
    }

    if (!sanitizedPresentations.length) {
      setProductAdminError("Cargá al menos una presentación con precio válido.");
      return;
    }

    const updatedProduct = {
      id: editingProductDraft.id,
      name: normalizedName,
      category: normalizedCategory,
      image: editingProductDraft.image.trim() || DEFAULT_PRODUCT_IMAGE,
      isVegan: Boolean(editingProductDraft.isVegan),
      outOfStock: Boolean(editingProductDraft.outOfStock),
      presentations: sanitizedPresentations.map((presentation) => ({
        label: presentation.label,
        price: Math.round(presentation.price),
      })),
    };

    setProducts((currentProducts) =>
      currentProducts.map((product) => (product.id === productId ? updatedProduct : product))
    );
    setEditingProductId(null);
    setEditingProductDraft(null);
    setProductAdminError("");
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setEditingProductDraft(null);
    setProductAdminError("");
  };

  const handleAdminLogin = (event) => {
    event.preventDefault();
    const normalizedUser = adminUserInput.trim().toLowerCase();

    if (normalizedUser === ADMIN_USER && adminPasswordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setIsAdminPanelOpen(true);
      setIsAdminModalOpen(false);
      setAdminUserInput("");
      setAdminPasswordInput("");
      setAdminError("");
      return;
    }

    setAdminError("Usuario o clave incorrecta.");
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setIsAdminPanelOpen(false);
    setIsAdminModalOpen(false);
    setAdminUserInput("");
    setAdminPasswordInput("");
    setAdminError("");
    setEditingCategory(null);
    setEditingCategoryValue("");
    setNewCategory("");
    setEditingProductId(null);
    setEditingProductDraft(null);
    setNewProductName("");
    setNewProductCategory("Sin tacc");
    setNewProductIsVegan(false);
    setNewProductPresentation("1kg");
    setNewProductPrice("");
    setNewProductImage("");
    setProductAdminError("");
  };

  const handleAdminAccessClick = () => {
    if (isAdmin) {
      setIsAdminPanelOpen((currentValue) => !currentValue);
      return;
    }

    setAdminError("");
    setIsAdminModalOpen(true);
  };

  const handleCategorySelect = (category) => {
    if (category === "Todas") {
      setSelectedCategory("Todas");
      setCategorySearch("");
      return;
    }

    if (selectedCategory === category) {
      setSelectedCategory("Todas");
      setCategorySearch("");
      return;
    }

    setSelectedCategory(category);
    setCategorySearch(category);
  };

  return (
    <div className="app-container">
      <header className="site-header">
        <h1 className="site-brand">
          <picture>
            <source srcSet="/images/logo.webp" type="image/webp" />
            <img className="site-brand-logo" src="/images/logo.jpeg" alt="Canelo" />
          </picture>
        </h1>

        <div className="header-actions">
          <button
            className="header-icon-button cart-icon-button"
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Abrir carrito, ${totals.totalItems} productos`}
          >
            <ShoppingCart aria-hidden="true" />
            {totals.totalItems > 0 && (
              <span className="cart-badge" aria-hidden="true">
                {totals.totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <main>
        <section className="category-admin-section">
          <button
            type="button"
            className="admin-access-link"
            onClick={handleAdminAccessClick}
          >
            {isAdmin ? "Panel admin" : "Ingresar admin"}
          </button>

          <div className="category-filter">
            <label className="field-label" htmlFor="category-filter">
              Ordenar por categoría
            </label>
            <input
              id="category-filter"
              className="select-field"
              type="text"
              value={categorySearch}
              placeholder="Buscar categoría..."
              onFocus={() => setIsCategorySuggestionsOpen(true)}
              onChange={(event) => {
                setCategorySearch(event.target.value);
                setIsCategorySuggestionsOpen(true);
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setIsCategorySuggestionsOpen(false);
                }, 120);
              }}
            />

            {isCategorySuggestionsOpen && (
              <div className="category-suggestions">
                <button
                  type="button"
                  className="category-suggestion-item"
                  onMouseDown={() => handleCategorySelect("Todas")}
                >
                  Todas
                </button>
                {filteredCategorySuggestions.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className="category-suggestion-item"
                    onMouseDown={() => handleCategorySelect(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            <div className="category-scroll" aria-label="Lista de categorías">
              <button
                type="button"
                className={`category-chip ${selectedCategory === "Todas" ? "active" : ""}`}
                onClick={() => handleCategorySelect("Todas")}
              >
                Todas
              </button>
              {allCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`category-chip ${selectedCategory === category ? "active" : ""}`}
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {isAdmin && isAdminPanelOpen && (
          <section className="admin-section">
            <div className="admin-header">
              <h2>Administrador</h2>
              <button className="button" type="button" onClick={handleAdminLogout}>
                Cerrar sesión
              </button>
            </div>

            <div className="category-admin-card">
              <h3>Categorías</h3>
              <form className="category-form" onSubmit={handleAddCategory}>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
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
                          onChange={(event) => setEditingCategoryValue(event.target.value)}
                        />
                        <div className="category-item-actions">
                          <button
                            className="button primary button-sm"
                            type="button"
                            onClick={() => handleSaveCategory(category)}
                          >
                            Guardar
                          </button>
                          <button
                            className="button button-sm"
                            type="button"
                            onClick={() => {
                              setEditingCategory(null);
                              setEditingCategoryValue("");
                            }}
                          >
                            Cancelar
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
                            className="button button-sm"
                            type="button"
                            onClick={() => handleStartEditCategory(category)}
                          >
                            Editar
                          </button>
                          <button
                            className="button button-sm button-danger"
                            type="button"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="product-admin-card">
              <h3>Productos</h3>

              <form
                className="product-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleAddProduct();
                }}
              >
                <input
                  type="text"
                  value={newProductName}
                  onChange={(event) => setNewProductName(event.target.value)}
                  placeholder="Nombre del producto"
                />
                <select
                  className="select-field"
                  value={newProductCategory}
                  onChange={(event) => setNewProductCategory(event.target.value)}
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
                  onChange={(event) => setNewProductPresentation(event.target.value)}
                  placeholder="Presentación (ej. 500g)"
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={newProductPrice}
                  onChange={(event) => setNewProductPrice(event.target.value)}
                  placeholder="Precio"
                />
                <input
                  type="url"
                  value={newProductImage}
                  onChange={(event) => setNewProductImage(event.target.value)}
                  placeholder="URL de foto (opcional)"
                />
                <input type="file" accept="image/*" onChange={handleNewProductImageFile} />
                <label className="stock-toggle">
                  <input
                    type="checkbox"
                    checked={newProductIsVegan}
                    onChange={(event) => setNewProductIsVegan(event.target.checked)}
                  />
                  Producto vegano
                </label>
                <button className="button primary" type="submit">
                  Agregar producto
                </button>
              </form>

              {productAdminError && <p className="admin-error">{productAdminError}</p>}

              <ul className="product-list">
                {products.map((product) => {
                  const isEditing = editingProductId === product.id && editingProductDraft;
                  return (
                    <li key={product.id} className="product-list-item">
                      {isEditing ? (
                        <div className="product-editor">
                          <input
                            type="text"
                            value={editingProductDraft.name}
                            onChange={(event) =>
                              handleEditProductField("name", event.target.value)
                            }
                            placeholder="Nombre"
                          />
                          <select
                            className="select-field"
                            value={editingProductDraft.category}
                            onChange={(event) =>
                              handleEditProductField("category", event.target.value)
                            }
                          >
                            {productCategoryOptions.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                          <input
                            type="url"
                            value={editingProductDraft.image}
                            onChange={(event) =>
                              handleEditProductField("image", event.target.value)
                            }
                            placeholder="URL de foto"
                          />
                          <input type="file" accept="image/*" onChange={handleEditProductImageFile} />

                          <label className="stock-toggle">
                            <input
                              type="checkbox"
                              checked={editingProductDraft.isVegan}
                              onChange={(event) =>
                                handleEditProductField("isVegan", event.target.checked)
                              }
                            />
                            Producto vegano
                          </label>

                          <label className="stock-toggle">
                            <input
                              type="checkbox"
                              checked={editingProductDraft.outOfStock}
                              onChange={(event) =>
                                handleEditProductField("outOfStock", event.target.checked)
                              }
                            />
                            Sin stock
                          </label>

                          <div className="presentation-admin-list">
                            {editingProductDraft.presentations.map((presentation, index) => (
                              <div key={`${product.id}-${index}`} className="presentation-admin-row">
                                <input
                                  type="text"
                                  value={presentation.label}
                                  onChange={(event) =>
                                    handleEditProductPresentationField(
                                      index,
                                      "label",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Presentación"
                                />
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={presentation.price}
                                  onChange={(event) =>
                                    handleEditProductPresentationField(
                                      index,
                                      "price",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Precio"
                                />
                                <button
                                  className="button"
                                  type="button"
                                  onClick={() => handleRemovePresentationFromDraft(index)}
                                >
                                  Quitar
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="product-editor-actions">
                            <button
                              className="button"
                              type="button"
                              onClick={handleAddPresentationToDraft}
                            >
                              + Presentación
                            </button>
                            <button
                              className="button primary"
                              type="button"
                              onClick={() => handleSaveEditedProduct(product.id)}
                            >
                              Guardar cambios
                            </button>
                            <button className="button" type="button" onClick={handleCancelEditProduct}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="product-admin-row">
                          <img
                            className="product-admin-image"
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                          />
                          <div className="product-admin-info">
                            <strong>{product.name}</strong>
                            <span>{product.category}</span>
                            <span>
                              {product.presentations
                                .map((presentation) => `${presentation.label}: $${presentation.price}`)
                                .join(" | ")}
                            </span>
                            <div className="product-admin-badges">
                              {product.isVegan && (
                                <span className="vegan-badge" aria-label="Producto vegano">
                                  <Vegan aria-hidden="true" />
                                </span>
                              )}
                              {product.outOfStock && <span className="stock-badge">Sin stock</span>}
                            </div>
                          </div>
                          <div className="product-admin-actions">
                            <button
                              className="button"
                              type="button"
                              onClick={() => handleStartEditProduct(product)}
                            >
                              Editar
                            </button>
                            <button
                              className="button"
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {groupedProducts.map(([category, categoryProducts]) => (
          <section key={category} className="category-section">
            <h2>{category}</h2>
            <div className="product-grid">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addItem} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setCartOpen(false)}
        items={items}
        totals={totals}
        setQuantity={setQuantity}
        removeItem={removeItem}
      />

      {isAdminModalOpen && (
        <>
          <button
            className="overlay"
            onClick={() => setIsAdminModalOpen(false)}
            aria-label="Cerrar modal de administrador"
          />
          <div className="modal-card admin-modal">
            <h2>Ingreso administrador</h2>
            <form className="admin-login-form" onSubmit={handleAdminLogin}>
              <label className="field-label" htmlFor="admin-user">
                Usuario
              </label>
              <input
                id="admin-user"
                type="text"
                value={adminUserInput}
                onChange={(event) => setAdminUserInput(event.target.value)}
                placeholder="Ingresar usuario"
                autoComplete="username"
              />

              <label className="field-label" htmlFor="admin-password">
                Clave
              </label>
              <input
                id="admin-password"
                type="password"
                value={adminPasswordInput}
                onChange={(event) => setAdminPasswordInput(event.target.value)}
                placeholder="Ingresar clave"
                autoComplete="current-password"
              />

              {adminError && <p className="admin-error">{adminError}</p>}

              <div className="modal-actions">
                <button
                  className="button"
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                >
                  Cancelar
                </button>
                <button className="button primary" type="submit">
                  Ingresar
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
