import { ShoppingCart } from "lucide-react";
import CatalogCategorySearch from "./components/CatalogCategorySearch";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminPanel from "./components/AdminPanel";
import ProductCard from "./components/ProductCard";
import GranolaLineCard from "./components/GranolaLineCard";
import FlavorLineCard from "./components/FlavorLineCard";
import FlavorPickerPanel from "./components/FlavorPickerPanel";
import CartAddToast from "./components/CartAddToast";
import CartDrawer from "./components/CartDrawer";
import ExitConfirmDialog from "./components/ExitConfirmDialog";
import SiteFooter from "./components/SiteFooter";
import { useCart } from "./context/CartContext";
import useBodyScrollLock from "./hooks/useBodyScrollLock";
import useBrowserBackNavigation from "./hooks/useBrowserBackNavigation";
import { fetchCatalogFromApi } from "./api/catalog";
import { clearCatalogLocalStorage } from "./utils/catalogCategories";
import { buildDisplayCategoryOrder } from "./utils/buildDisplayCategoryOrder";
import {
  clearAdminToken,
  loginAdmin,
  setAdminToken,
  verifyAdminSession,
} from "./api/adminAuth";
import {
  createCategory as createCategoryApi,
  createProduct as createProductApi,
  deleteCategory as deleteCategoryApi,
  deleteProduct as deleteProductApi,
  renameCategory as renameCategoryApi,
  reorderShelfCategories as reorderShelfCategoriesApi,
  updateProduct as updateProductApi,
} from "./api/adminCatalog";
import initialProducts from "./data/products.json";
import {
  GLUTEN_FREE_FILTER_CATEGORY,
  KETO_FILTER_CATEGORY,
  VEGAN_FILTER_CATEGORY,
  getProductCategoryOptions,
  isGlutenFreeFilterCategory,
  isKetoFilterCategory,
  isShelfCategory,
  isStoreFilterCategory,
  isVeganFilterCategory,
} from "./utils/productCategories";
import { flavorLineShowsPresentationsOnCard } from "./utils/mixFrutosSecosShelf";
import {
  DEFAULT_PRODUCT_IMAGE,
  PRODUCT_TYPE_FLAVORED,
  PRODUCT_TYPE_FLAVOR_LINE,
  productHasFlavorVariants,
  sanitizePresentations,
  sanitizeProducts,
  sanitizeShelfNote,
  sanitizeVariants,
} from "./utils/sanitizeCatalog";
import {
  createDefaultNewProductPresentations,
  createDefaultNewProductVariant,
  createDefaultNewProductVariants,
} from "./utils/adminNewProductDefaults";
import { validateAdminNewProduct } from "./utils/validateAdminNewProduct";
import { CART_ADD_TOAST_MESSAGE } from "./utils/cartAddToast";
import { createTimedNotice } from "./utils/timedNotice";
import { buildAdminNewProduct } from "./utils/buildAdminNewProduct";
import {
  dismissPreviousCartOffer,
  loadPreviousCartOffer,
  savePreviousCart,
} from "./utils/previousCartStorage";

const CATEGORIES_STORAGE_KEY = "canelo.categories";
const PRODUCTS_STORAGE_KEY = "canelo.products";
const PRODUCTS_VERSION_STORAGE_KEY = "canelo.products-version";
const PRODUCTS_DATA_VERSION = 16;
const ADMIN_SESSION_STORAGE_KEY = "canelo.admin-session";
const ENABLE_REMOTE_ADMIN_WRITES = import.meta.env.VITE_ENABLE_REMOTE_ADMIN_WRITES !== "false";

const DEFAULT_CATEGORIES = [
  GLUTEN_FREE_FILTER_CATEGORY,
  "Granolas",
  KETO_FILTER_CATEGORY,
  "Frutos secos",
  "Semillas",
  "Avenas/Arroz/Harinas",
  "Cereales",
  "Pastas de mani",
  "Maní suelto",
  "Miel/Polen",
  "Ghee",
  "Barritas",
  "Combos",
  "Varios",
  "Aceite de coco",
  "Veganos",
  "Congelados"
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
  const [isCartBadgeBumping, setIsCartBadgeBumping] = useState(false);
  const prevTotalItemsRef = useRef(0);
  const {
    items,
    totals,
    addItem,
    addFlavorLineItem,
    setQuantity,
    removeItem,
    clearCart,
    restoreItems,
    reconcileWithCatalog,
  } = useCart();
  const [activeFlavorLine, setActiveFlavorLine] = useState(null);
  const [isFlavorPickerOpen, setFlavorPickerOpen] = useState(false);
  const [linePresentationById, setLinePresentationById] = useState({});

  const getLinePresentationLabel = useCallback(
    (line) => {
      if (!line?.presentations?.length) return "";
      const stored = linePresentationById[line.id];
      if (stored && line.presentations.some((presentation) => presentation.label === stored)) {
        return stored;
      }
      return line.presentations[0].label;
    },
    [linePresentationById]
  );

  const setLinePresentationLabel = useCallback((lineId, label) => {
    setLinePresentationById((current) => ({ ...current, [lineId]: label }));
  }, []);
  const [cartReconcileNotice, setCartReconcileNotice] = useState("");
  const [cartAddToastMessage, setCartAddToastMessage] = useState("");
  const cartAddNoticeRef = useRef(null);

  useEffect(() => {
    cartAddNoticeRef.current = createTimedNotice({
      onShow: setCartAddToastMessage,
      onHide: () => setCartAddToastMessage(""),
    });

    return () => {
      cartAddNoticeRef.current?.cancel();
    };
  }, []);

  const handleAddToCart = useCallback(
    (product, presentation) => {
      addItem(product, presentation);
      cartAddNoticeRef.current?.show(CART_ADD_TOAST_MESSAGE);
    },
    [addItem]
  );

  const handleOpenFlavorPicker = useCallback((line) => {
    setActiveFlavorLine(line);
    setFlavorPickerOpen(true);
  }, []);

  const handleCloseFlavorPicker = useCallback(() => {
    setFlavorPickerOpen(false);
    setActiveFlavorLine(null);
  }, []);

  const handleAddFlavorLineToCart = useCallback(
    (line, variant, presentation) => {
      addFlavorLineItem(line, variant, presentation);
      cartAddNoticeRef.current?.show(CART_ADD_TOAST_MESSAGE);
    },
    [addFlavorLineItem]
  );

  useEffect(() => {
    if (totals.totalItems > prevTotalItemsRef.current) {
      setIsCartBadgeBumping(false);
      const frameId = requestAnimationFrame(() => setIsCartBadgeBumping(true));
      const timeoutId = window.setTimeout(() => setIsCartBadgeBumping(false), 500);
      prevTotalItemsRef.current = totals.totalItems;
      return () => {
        cancelAnimationFrame(frameId);
        window.clearTimeout(timeoutId);
      };
    }
    prevTotalItemsRef.current = totals.totalItems;
  }, [totals.totalItems]);
  const [products, setProducts] = useState([]);
  const [categoryRows, setCategoryRows] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [categoryAdminError, setCategoryAdminError] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isCategorySuggestionsOpen, setIsCategorySuggestionsOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminUserInput, setAdminUserInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdminLoginPending, setIsAdminLoginPending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() =>
    loadStoredData(ADMIN_SESSION_STORAGE_KEY, false)
  );
  const [activeView, setActiveView] = useState("catalogo");
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [expandedAdminCategories, setExpandedAdminCategories] = useState(() => new Set());
  const [isCategoryToolsOpen, setIsCategoryToolsOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductShelfNote, setNewProductShelfNote] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Sin tacc");
  const [newProductPresentations, setNewProductPresentations] = useState(
    createDefaultNewProductPresentations
  );
  const [newProductVariants, setNewProductVariants] = useState([]);
  const [newProductIsVegan, setNewProductIsVegan] = useState(false);
  const [newProductIsKeto, setNewProductIsKeto] = useState(false);
  const [newProductIsGlutenFree, setNewProductIsGlutenFree] = useState(false);
  const [newProductImage, setNewProductImage] = useState("");
  const [newProductType, setNewProductType] = useState("simple");
  const [productAdminError, setProductAdminError] = useState("");
  const [adminPendingAction, setAdminPendingAction] = useState("");
  const [isCatalogApiAvailable, setIsCatalogApiAvailable] = useState(false);
  const [catalogLoadStatus, setCatalogLoadStatus] = useState("loading");
  const [isCatalogRefreshing, setIsCatalogRefreshing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProductDraft, setEditingProductDraft] = useState(null);

  const isProductEditModalOpen = Boolean(editingProductId && editingProductDraft);
  const [isExitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [previousCartOfferVersion, setPreviousCartOfferVersion] = useState(0);
  useBodyScrollLock(
    isCartOpen ||
      isFlavorPickerOpen ||
      isAdminModalOpen ||
      isProductEditModalOpen ||
      isExitConfirmOpen
  );

  const previousCartOffer = useMemo(() => {
    if (items.length > 0) {
      return null;
    }

    return loadPreviousCartOffer();
  }, [items.length, previousCartOfferVersion, isCartOpen]);

  const handleSavePreviousCart = useCallback((cartItems) => {
    savePreviousCart(cartItems);
    setPreviousCartOfferVersion((version) => version + 1);
  }, []);

  const handleDismissPreviousCart = useCallback(() => {
    dismissPreviousCartOffer();
    setPreviousCartOfferVersion((version) => version + 1);
  }, []);

  const handleRestorePreviousCart = useCallback(() => {
    const offer = loadPreviousCartOffer();
    if (!offer?.items?.length) {
      return;
    }

    restoreItems(offer.items);
  }, [restoreItems]);

  const handleCloseNavigationLayer = useCallback(
    (layer) => {
      if (layer === "cart") {
        setCartOpen(false);
        return;
      }

      if (layer === "flavorPicker") {
        handleCloseFlavorPicker();
        return;
      }

      if (layer === "adminLogin") {
        setIsAdminModalOpen(false);
        return;
      }

      if (layer === "productEdit") {
        setEditingProductId(null);
        setEditingProductDraft(null);
        setProductAdminError("");
      }
    },
    [handleCloseFlavorPicker]
  );

  const handleSwitchToCatalogo = useCallback(() => {
    setActiveView("catalogo");
  }, []);

  const handleRequestExitConfirm = useCallback(() => {
    setExitConfirmOpen(true);
  }, []);

  const handleStayOnSite = useCallback(() => {
    setExitConfirmOpen(false);
  }, []);

  const handleLeaveSite = useCallback(() => {
    setExitConfirmOpen(false);
    window.history.back();
  }, []);

  useBrowserBackNavigation({
    layers: {
      productEdit: isProductEditModalOpen,
      adminLogin: isAdminModalOpen,
      flavorPicker: isFlavorPickerOpen,
      cart: isCartOpen,
    },
    isAdmin,
    activeView,
    cartItemCount: totals.totalItems,
    onCloseLayer: handleCloseNavigationLayer,
    onSwitchToCatalogo: handleSwitchToCatalogo,
    onConfirmExit: handleRequestExitConfirm,
  });

  const newProductDraftId = useMemo(
    () => slugify(newProductName.trim()) || "producto-nuevo",
    [newProductName]
  );

  useEffect(() => {
    if (!productHasFlavorVariants(newProductType)) {
      setNewProductVariants([]);
      return;
    }
    setNewProductVariants((current) =>
      current.length
        ? current
        : createDefaultNewProductVariants(
            newProductDraftId,
            newProductImage.trim() || DEFAULT_PRODUCT_IMAGE
          )
    );
  }, [newProductDraftId, newProductImage, newProductType]);

  const applyOfflineCatalog = useCallback(() => {
    const fallbackProducts = sanitizeProducts(initialProducts);
    setProducts(fallbackProducts);
    setCategoryRows([]);
    return fallbackProducts.length > 0;
  }, []);

  const mergeApiCatalogInState = useCallback(({ categories: apiCategories, products: apiProducts }) => {
    const sanitizedProducts = sanitizeProducts(apiProducts);
    setProducts(sanitizedProducts);
    setCategoryRows(apiCategories);
    return sanitizedProducts.length > 0 || apiCategories.length > 0;
  }, []);

  const refreshCatalogFromApi = useCallback(
    async ({ showRefreshing = false } = {}) => {
      if (showRefreshing) {
        setIsCatalogRefreshing(true);
      }

      try {
        const apiCatalog = await fetchCatalogFromApi();
        const hasData = mergeApiCatalogInState(apiCatalog);
        setIsCatalogApiAvailable(true);
        setCatalogLoadStatus("ready");
        clearCatalogLocalStorage();
        window.localStorage.setItem(
          PRODUCTS_VERSION_STORAGE_KEY,
          JSON.stringify(PRODUCTS_DATA_VERSION)
        );
        return hasData;
      } catch {
        setIsCatalogApiAvailable(false);
        setCatalogLoadStatus("offline");
        const hasData = applyOfflineCatalog();
        return hasData;
      } finally {
        if (showRefreshing) {
          setIsCatalogRefreshing(false);
        }
      }
    },
    [applyOfflineCatalog, mergeApiCatalogInState]
  );

  useEffect(() => {
    const storedVersion = loadStoredData(PRODUCTS_VERSION_STORAGE_KEY, 0);
    if (storedVersion !== PRODUCTS_DATA_VERSION) {
      clearCatalogLocalStorage();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setCatalogLoadStatus("loading");
      await refreshCatalogFromApi();
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshCatalogFromApi]);

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
    if (isCatalogApiAvailable) return;
    window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categoryRows));
  }, [categoryRows, isCatalogApiAvailable]);

  useEffect(() => {
    if (isCatalogApiAvailable) return;
    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    window.localStorage.setItem(
      PRODUCTS_VERSION_STORAGE_KEY,
      JSON.stringify(PRODUCTS_DATA_VERSION)
    );
  }, [products, isCatalogApiAvailable]);

  useEffect(() => {
    window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isAdmin) {
        clearAdminToken();
        return;
      }

      const isValid = await verifyAdminSession();
      if (cancelled) return;

      if (!isValid) {
        setIsAdmin(false);
        setActiveView("catalogo");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const allCategories = useMemo(
    () =>
      buildDisplayCategoryOrder({
        apiCategories: categoryRows,
        products,
        fallbackOrder: DEFAULT_CATEGORIES,
      }),
    [categoryRows, products]
  );

  const storeFilterCategories = useMemo(
    () => allCategories.filter((category) => isStoreFilterCategory(category)),
    [allCategories]
  );

  const shelfCategories = useMemo(
    () => allCategories.filter((category) => isShelfCategory(category)),
    [allCategories]
  );

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

  useEffect(() => {
    if (!items.length) {
      setCartReconcileNotice("");
      return;
    }

    const { removedCount } = reconcileWithCatalog(products);
    if (removedCount > 0) {
      setCartReconcileNotice(
        removedCount === 1
          ? "Quitamos 1 producto del carrito porque ya no está disponible."
          : `Quitamos ${removedCount} productos del carrito porque ya no están disponibles.`
      );
      return;
    }

    setCartReconcileNotice("");
  }, [products, reconcileWithCatalog]);

  const visibleProducts = useMemo(() => {
    if (selectedProductId) {
      const product = products.find((item) => item.id === selectedProductId);
      return product ? [product] : [];
    }

    let filtered = products;

    if (selectedCategory !== "Todas") {
      if (isVeganFilterCategory(selectedCategory)) {
        filtered = filtered.filter((product) => product.isVegan);
      } else if (isGlutenFreeFilterCategory(selectedCategory)) {
        filtered = filtered.filter((product) => product.isGlutenFree);
      } else if (isKetoFilterCategory(selectedCategory)) {
        filtered = filtered.filter((product) => product.isKeto);
      } else {
        filtered = filtered.filter((product) => product.category === selectedCategory);
      }
    }

    const normalizedSearch = categorySearch.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.category.toLowerCase().includes(normalizedSearch)
      );
    }

    return filtered;
  }, [products, selectedCategory, selectedProductId, categorySearch]);

  const sortCategoryEntries = useCallback(
    (entries) =>
      [...entries].sort(([categoryA], [categoryB]) => {
        const indexA = allCategories.indexOf(categoryA);
        const indexB = allCategories.indexOf(categoryB);

        if (indexA === -1 || indexB === -1) {
          return categoryA.localeCompare(categoryB, "es");
        }

        return indexA - indexB;
      }),
    [allCategories]
  );

  const groupedProducts = useMemo(() => {
    const grouped = visibleProducts.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {});

    return sortCategoryEntries(Object.entries(grouped));
  }, [sortCategoryEntries, visibleProducts]);

  const adminGroupedProducts = useMemo(() => {
    const grouped = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {});

    return sortCategoryEntries(Object.entries(grouped));
  }, [products, sortCategoryEntries]);

  const expandAdminCategory = useCallback((category) => {
    if (!category) return;
    setExpandedAdminCategories((current) => new Set([...current, category]));
  }, []);

  const toggleAdminCategory = useCallback((category) => {
    setExpandedAdminCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const expandAllAdminCategories = useCallback(() => {
    setExpandedAdminCategories(new Set(adminGroupedProducts.map(([category]) => category)));
  }, [adminGroupedProducts]);

  const collapseAllAdminCategories = useCallback(() => {
    setExpandedAdminCategories(new Set());
  }, []);

  const catalogSearchSuggestions = useMemo(() => {
    const normalizedSearch = categorySearch.trim().toLowerCase();

    const categoryMatches = normalizedSearch
      ? allCategories.filter((category) => category.toLowerCase().includes(normalizedSearch))
      : allCategories;

    const productMatches = normalizedSearch
      ? products
          .filter(
            (product) =>
              product.name.toLowerCase().includes(normalizedSearch) ||
              product.category.toLowerCase().includes(normalizedSearch)
          )
          .slice(0, 12)
      : [];

    return { categories: categoryMatches, products: productMatches };
  }, [allCategories, categorySearch, products]);

  const hasCatalogSearchSuggestions =
    catalogSearchSuggestions.categories.length > 0 ||
    catalogSearchSuggestions.products.length > 0;

  const categoryProductCount = useMemo(() => {
    return products.reduce((acc, product) => {
      const normalizedCategory = normalizeCategoryName(product.category || "Sin tacc");
      acc[normalizedCategory] = (acc[normalizedCategory] ?? 0) + 1;
      if (product.isVegan) {
        acc[VEGAN_FILTER_CATEGORY] = (acc[VEGAN_FILTER_CATEGORY] ?? 0) + 1;
      }
      if (product.isKeto) {
        acc[KETO_FILTER_CATEGORY] = (acc[KETO_FILTER_CATEGORY] ?? 0) + 1;
      }
      if (product.isGlutenFree && !isGlutenFreeFilterCategory(normalizedCategory)) {
        acc[GLUTEN_FREE_FILTER_CATEGORY] = (acc[GLUTEN_FREE_FILTER_CATEGORY] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [products]);

  const visibleCategoryChips = useMemo(
    () =>
      allCategories.filter((category) => {
        const count = categoryProductCount[category] ?? 0;
        return count > 0;
      }),
    [allCategories, categoryProductCount]
  );

  const ensureCatalogApiWritable = () => {
    if (!ENABLE_REMOTE_ADMIN_WRITES) {
      setCategoryAdminError("La gestión remota está desactivada en esta versión del frontend.");
      setProductAdminError("La gestión remota está desactivada en esta versión del frontend.");
      return false;
    }
    if (isCatalogApiAvailable) return true;
    setCategoryAdminError(
      "La API de catálogo no está disponible. Podés navegar el catálogo, pero la gestión está en modo solo lectura."
    );
    setProductAdminError(
      "La API de catálogo no está disponible. Podés navegar el catálogo, pero la gestión está en modo solo lectura."
    );
    return false;
  };

  const withAdminPendingAction = async (actionKey, task) => {
    setAdminPendingAction(actionKey);
    try {
      return await task();
    } finally {
      setAdminPendingAction("");
    }
  };

  const handleAddCategory = async (event) => {
    event.preventDefault();
    if (!ensureCatalogApiWritable()) return;
    const normalizedName = normalizeCategoryLabel(newCategory);
    if (!normalizedName) return;

    const alreadyExists = allCategories.some(
      (category) => category.toLowerCase() === normalizedName.toLowerCase()
    );

    if (alreadyExists) {
      setCategoryAdminError("Ya existe una categoría con ese nombre.");
      return;
    }

    setCategoryAdminError("");
    await withAdminPendingAction("add-category", async () => {
      await createCategoryApi(normalizedName);
      await refreshCatalogFromApi({ showRefreshing: true });
      setNewCategory("");
    }).catch((err) => {
      setCategoryAdminError(err?.message || "No se pudo crear la categoría.");
    });
  };

  const handleStartEditCategory = (category) => {
    setEditingCategory(category);
    setEditingCategoryValue(category);
  };

  const handleSaveCategory = async (previousCategory) => {
    if (!ensureCatalogApiWritable()) return;
    const normalizedName = normalizeCategoryLabel(editingCategoryValue);
    if (!normalizedName) return;

    const alreadyExists = allCategories.some(
      (category) =>
        category.toLowerCase() === normalizedName.toLowerCase() &&
        category.toLowerCase() !== previousCategory.toLowerCase()
    );

    if (alreadyExists) {
      setCategoryAdminError("Ya existe una categoría con ese nombre.");
      return;
    }

    setCategoryAdminError("");
    await withAdminPendingAction("rename-category", async () => {
      await renameCategoryApi(previousCategory, normalizedName);
      await refreshCatalogFromApi({ showRefreshing: true });
      if (selectedCategory === previousCategory) {
        setSelectedCategory(normalizedName);
      }
      setEditingCategory(null);
      setEditingCategoryValue("");
    }).catch((err) => {
      setCategoryAdminError(err?.message || "No se pudo renombrar la categoría.");
    });
  };

  const handleDeleteCategory = async (categoryToDelete) => {
    if (!ensureCatalogApiWritable()) return;
    const shouldDelete = window.confirm(
      `Se va a eliminar la categoría "${categoryToDelete}". Los productos pasarán a "Sin tacc".`
    );

    if (!shouldDelete) return;

    setCategoryAdminError("");
    await withAdminPendingAction("delete-category", async () => {
      await deleteCategoryApi(categoryToDelete);
      await refreshCatalogFromApi({ showRefreshing: true });
      if (selectedCategory === categoryToDelete) {
        setSelectedCategory("Todas");
      }
    }).catch((err) => {
      setCategoryAdminError(err?.message || "No se pudo eliminar la categoría.");
    });
  };

  const handleMoveShelfCategory = async (categoryName, delta) => {
    if (!ensureCatalogApiWritable()) return;

    const currentOrder = [...shelfCategories];
    const index = currentOrder.indexOf(categoryName);
    if (index < 0) return;

    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= currentOrder.length) return;

    const nextOrder = [...currentOrder];
    [nextOrder[index], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[index]];

    setCategoryAdminError("");
    await withAdminPendingAction("reorder-categories", async () => {
      await reorderShelfCategoriesApi(nextOrder);
      await refreshCatalogFromApi({ showRefreshing: true });
    }).catch((err) => {
      setCategoryAdminError(err?.message || "No se pudo guardar el orden de categorías.");
    });
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

  const handleNewProductPresentationChange = (index, field, value) => {
    setNewProductPresentations((current) =>
      current.map((presentation, presentationIndex) =>
        presentationIndex === index ? { ...presentation, [field]: value } : presentation
      )
    );
  };

  const handleAddNewProductPresentation = () => {
    setNewProductPresentations((current) => [...current, { label: "", price: "" }]);
  };

  const handleRemoveNewProductPresentation = (index) => {
    setNewProductPresentations((current) =>
      current.length === 1 ? current : current.filter((_, presentationIndex) => presentationIndex !== index)
    );
  };

  const handleNewProductVariantChange = (index, field, value) => {
    setNewProductVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const handleAddNewProductVariant = () => {
    setNewProductVariants((current) => [
      ...current,
      createDefaultNewProductVariant(
        newProductDraftId,
        newProductImage.trim() || DEFAULT_PRODUCT_IMAGE,
        current.length + 1
      ),
    ]);
  };

  const handleRemoveNewProductVariant = (index) => {
    setNewProductVariants((current) =>
      current.length === 1 ? current : current.filter((_, variantIndex) => variantIndex !== index)
    );
  };

  const handleNewProductVariantImageFile = (index, event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      setNewProductVariants((current) =>
        current.map((variant, variantIndex) =>
          variantIndex === index ? { ...variant, image: String(reader.result) } : variant
        )
      );
      setProductAdminError("");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleAddProduct = async () => {
    if (!ensureCatalogApiWritable()) return;

    const normalizedName = newProductName.trim();
    const normalizedCategory = normalizeCategoryName(newProductCategory || "");
    const categoryExists = allCategories.some(
      (category) => category.toLowerCase() === normalizedCategory.toLowerCase()
    );

    const validationError = validateAdminNewProduct({
      name: normalizedName,
      category: normalizedCategory,
      categoryExists,
      presentations: newProductPresentations,
      productType: newProductType,
      variants: newProductVariants,
    });

    if (validationError) {
      setProductAdminError(validationError);
      return;
    }

    const sanitizedPresentations = sanitizePresentations(
      newProductPresentations.map((presentation) => ({
        label: presentation.label.trim(),
        price: normalizePriceValue(presentation.price),
      }))
    );

    const hasFlavorVariants = productHasFlavorVariants(newProductType);
    const sanitizedVariants = hasFlavorVariants
      ? sanitizeVariants(
          newProductVariants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            image: variant.image,
            description: variant.description,
            contents: String(variant.contentsText ?? "")
              .split("\n")
              .map((entry) => entry.trim())
              .filter(Boolean),
            isVegan: variant.isVegan,
            outOfStock: variant.outOfStock,
          })),
          { defaultImage: newProductImage.trim() || DEFAULT_PRODUCT_IMAGE }
        )
      : [];

    const generatedBase = slugify(normalizedName) || "producto";
    const existingIds = new Set(products.map((product) => product.id));
    let generatedId = generatedBase;
    let suffix = 2;
    while (existingIds.has(generatedId)) {
      generatedId = `${generatedBase}-${suffix}`;
      suffix += 1;
    }

    const nextProduct = buildAdminNewProduct({
      id: generatedId,
      name: normalizedName,
      category: normalizedCategory,
      image: newProductImage.trim() || DEFAULT_PRODUCT_IMAGE,
      isVegan: newProductIsVegan,
      isKeto: newProductIsKeto,
      isGlutenFree:
        newProductIsGlutenFree || isGlutenFreeFilterCategory(normalizedCategory),
      presentations: sanitizedPresentations,
      productType: newProductType,
      shelfNote: newProductShelfNote,
      variants: sanitizedVariants,
    });

    await withAdminPendingAction("add-product", async () => {
      await createProductApi(nextProduct);
      await refreshCatalogFromApi({ showRefreshing: true });
      expandAdminCategory(normalizedCategory);
      setNewProductName("");
      setNewProductShelfNote("");
      setNewProductCategory("Sin tacc");
      setNewProductIsVegan(false);
      setNewProductIsKeto(false);
      setNewProductIsGlutenFree(false);
      setNewProductPresentations(createDefaultNewProductPresentations());
      setNewProductVariants([]);
      setNewProductImage("");
      setNewProductType("simple");
      setProductAdminError("");
    }).catch((err) => {
      setProductAdminError(err?.message || "No se pudo crear el producto.");
    });
  };

  const handleDeleteProduct = async (productId) => {
    if (!ensureCatalogApiWritable()) return;
    const targetProduct = products.find((product) => product.id === productId);
    if (!targetProduct) return;

    const shouldDelete = window.confirm(
      `Se va a eliminar el producto "${targetProduct.name}". Esta acción no se puede deshacer.`
    );
    if (!shouldDelete) return;

    await withAdminPendingAction("delete-product", async () => {
      await deleteProductApi(productId);
      await refreshCatalogFromApi({ showRefreshing: true });
      if (editingProductId === productId) {
        setEditingProductId(null);
        setEditingProductDraft(null);
      }
    }).catch((err) => {
      setProductAdminError(err?.message || "No se pudo eliminar el producto.");
    });
  };

  const handleStartEditProduct = (product) => {
    expandAdminCategory(product.category);
    setEditingProductId(product.id);
    setEditingProductDraft({
      id: product.id,
      name: product.name,
      category: product.category,
      image: product.image,
      productType: product.productType ?? "simple",
      isVegan: Boolean(product.isVegan),
      isKeto: Boolean(product.isKeto),
      isGlutenFree: Boolean(product.isGlutenFree),
      outOfStock: Boolean(product.outOfStock),
      shelfNote: product.shelfNote ?? "",
      presentations: product.presentations.map((presentation) => ({
        label: presentation.label,
        price: String(presentation.price),
      })),
      variants: (product.variants ?? []).map((variant) => ({
        id: variant.id,
        label: variant.label,
        image: variant.image,
        description: variant.description ?? "",
        contentsText: (variant.contents ?? []).join("\n"),
        isVegan: Boolean(variant.isVegan),
        outOfStock: Boolean(variant.outOfStock),
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

  const handleEditVariantField = (index, field, value) => {
    setEditingProductDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;
      return {
        ...currentDraft,
        variants: (currentDraft.variants ?? []).map((variant, variantIndex) =>
          variantIndex === index ? { ...variant, [field]: value } : variant
        ),
      };
    });
  };

  const handleAddVariantToDraft = () => {
    setEditingProductDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;
      const nextIndex = (currentDraft.variants?.length ?? 0) + 1;
      return {
        ...currentDraft,
        variants: [
          ...(currentDraft.variants ?? []),
          {
            id: `${currentDraft.id}-sabor-${nextIndex}`,
            label: "",
            image: currentDraft.image,
            description: "",
            contentsText: "",
            isVegan: false,
            outOfStock: false,
          },
        ],
      };
    });
  };

  const handleRemoveVariantFromDraft = (index) => {
    setEditingProductDraft((currentDraft) => {
      if (!currentDraft || (currentDraft.variants?.length ?? 0) <= 1) return currentDraft;
      return {
        ...currentDraft,
        variants: currentDraft.variants.filter((_, variantIndex) => variantIndex !== index),
      };
    });
  };

  const handleEditVariantImageFile = (index, event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setProductAdminError("La foto debe ser un archivo de imagen.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleEditVariantField(index, "image", String(reader.result));
      setProductAdminError("");
    };
    reader.readAsDataURL(selectedFile);
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

  const handleSaveEditedProduct = async (productId) => {
    if (!ensureCatalogApiWritable()) return;
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

    if (isVeganFilterCategory(normalizedCategory) || isKetoFilterCategory(normalizedCategory)) {
      setProductAdminError(
        'Elegí el tipo de producto, no "Veganos/Keto". Marcá los checks de producto si corresponde.'
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

    const hasFlavorVariants = productHasFlavorVariants(editingProductDraft.productType);
    const sanitizedVariants = hasFlavorVariants
      ? sanitizeVariants(
          (editingProductDraft.variants ?? []).map((variant) => ({
            id: variant.id,
            label: variant.label,
            image: variant.image,
            description: variant.description,
            contents: String(variant.contentsText ?? "")
              .split("\n")
              .map((entry) => entry.trim())
              .filter(Boolean),
            isVegan: variant.isVegan,
            outOfStock: variant.outOfStock,
          }))
        )
      : [];

    if (hasFlavorVariants && !sanitizedVariants.length) {
      setProductAdminError("Cargá al menos un sabor con nombre.");
      return;
    }

    const normalizedShelfNote = hasFlavorVariants
      ? ""
      : sanitizeShelfNote(editingProductDraft.shelfNote);

    const updatedProduct = {
      id: editingProductDraft.id,
      name: normalizedName,
      category: normalizedCategory,
      image: editingProductDraft.image.trim() || DEFAULT_PRODUCT_IMAGE,
      productType: hasFlavorVariants ? editingProductDraft.productType : "simple",
      ...(hasFlavorVariants ? {} : { shelfNote: normalizedShelfNote }),
      isVegan: Boolean(editingProductDraft.isVegan),
      isKeto: Boolean(editingProductDraft.isKeto),
      isGlutenFree:
        Boolean(editingProductDraft.isGlutenFree) ||
        isGlutenFreeFilterCategory(normalizedCategory),
      outOfStock: Boolean(editingProductDraft.outOfStock),
      presentations: sanitizedPresentations.map((presentation) => ({
        label: presentation.label,
        price: Math.round(presentation.price),
      })),
      variants: sanitizedVariants,
    };

    await withAdminPendingAction("update-product", async () => {
      await updateProductApi(productId, updatedProduct);
      await refreshCatalogFromApi({ showRefreshing: true });
      expandAdminCategory(normalizedCategory);
      setEditingProductId(null);
      setEditingProductDraft(null);
      setProductAdminError("");
    }).catch((err) => {
      setProductAdminError(err?.message || "No se pudo actualizar el producto.");
    });
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setEditingProductDraft(null);
    setProductAdminError("");
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setAdminError("");
    setIsAdminLoginPending(true);

    try {
      const { token } = await loginAdmin(adminUserInput, adminPasswordInput);
      setAdminToken(token);
      setIsAdmin(true);
      setActiveView("gestion");
      setExpandedAdminCategories(new Set());
      setIsCategoryToolsOpen(false);
      setIsAddProductOpen(false);
      setIsAdminModalOpen(false);
      setAdminUserInput("");
      setAdminPasswordInput("");
    } catch (err) {
      setAdminError(err?.message || "Usuario o clave incorrecta.");
    } finally {
      setIsAdminLoginPending(false);
    }
  };

  const handleAdminLogout = () => {
    clearAdminToken();
    setIsAdmin(false);
    setActiveView("catalogo");
    setExpandedAdminCategories(new Set());
    setIsCategoryToolsOpen(false);
    setIsAddProductOpen(false);
    setIsAdminModalOpen(false);
    setAdminUserInput("");
    setAdminPasswordInput("");
    setAdminError("");
    setEditingCategory(null);
    setEditingCategoryValue("");
    setNewCategory("");
    setCategoryAdminError("");
    setEditingProductId(null);
    setEditingProductDraft(null);
    setNewProductName("");
    setNewProductCategory("Sin tacc");
    setNewProductIsVegan(false);
    setNewProductIsKeto(false);
    setNewProductIsGlutenFree(false);
    setNewProductPresentation("1kg");
    setNewProductPrice("");
    setNewProductImage("");
    setProductAdminError("");
    setAdminPendingAction("");
  };

  const handleAdminAccessClick = () => {
    if (isAdmin) {
      setActiveView("gestion");
      return;
    }

    setAdminError("");
    setIsAdminModalOpen(true);
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditingCategoryValue("");
    setCategoryAdminError("");
  };

  const handleCategorySelect = (category) => {
    setSelectedProductId(null);

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

  const handleProductSelect = (product) => {
    setSelectedProductId(product.id);
    setSelectedCategory("Todas");
    setCategorySearch(product.name);
    setIsCategorySuggestionsOpen(false);
  };

  const handleResetCatalogView = useCallback(() => {
    setSelectedCategory("Todas");
    setCategorySearch("");
    setSelectedProductId(null);
    setIsCategorySuggestionsOpen(false);
  }, []);

  useEffect(() => {
    if (!selectedProductId) return;
    const product = products.find((item) => item.id === selectedProductId);
    if (!product) {
      setSelectedProductId(null);
    }
  }, [products, selectedProductId]);

  const catalogEmptyState = useMemo(() => {
    if (catalogLoadStatus === "loading" || visibleProducts.length > 0) {
      return null;
    }

    const searchText = categorySearch.trim();

    if (catalogLoadStatus === "offline" && products.length === 0) {
      return {
        message: "No pudimos cargar el catálogo. Revisá tu conexión e intentá de nuevo.",
        actionLabel: "Reintentar",
        onAction: () => refreshCatalogFromApi(),
      };
    }

    if (selectedProductId && searchText) {
      return {
        message: "El producto que buscabas ya no está en el catálogo.",
        actionLabel: "Ver todo el catálogo",
        onAction: handleResetCatalogView,
      };
    }

    if (searchText) {
      return {
        message: `No encontramos productos para «${searchText}».`,
        actionLabel: "Limpiar búsqueda",
        onAction: handleResetCatalogView,
      };
    }

    if (selectedCategory !== "Todas") {
      if (isVeganFilterCategory(selectedCategory)) {
        return {
          message: "No hay productos veganos marcados por ahora.",
          actionLabel: "Ver todas las categorías",
          onAction: handleResetCatalogView,
        };
      }
      if (isKetoFilterCategory(selectedCategory)) {
        return {
          message: "No hay productos aptos keto marcados por ahora.",
          actionLabel: "Ver todas las categorías",
          onAction: handleResetCatalogView,
        };
      }
      if (isGlutenFreeFilterCategory(selectedCategory)) {
        return {
          message: "No hay productos sin TACC marcados por ahora.",
          actionLabel: "Ver todas las categorías",
          onAction: handleResetCatalogView,
        };
      }
      return {
        message: `No hay productos en «${selectedCategory}» por ahora.`,
        actionLabel: "Ver todas las categorías",
        onAction: handleResetCatalogView,
      };
    }

    if (products.length === 0) {
      return {
        message: "El catálogo está vacío.",
        actionLabel: null,
        onAction: null,
      };
    }

    return null;
  }, [
    catalogLoadStatus,
    categorySearch,
    handleResetCatalogView,
    products.length,
    refreshCatalogFromApi,
    selectedCategory,
    selectedProductId,
    visibleProducts.length,
  ]);

  const showSearchNoMatches =
    isCategorySuggestionsOpen &&
    categorySearch.trim().length > 0 &&
    !hasCatalogSearchSuggestions;

  return (
    <div className="app-container">
      <header className="site-header">
        <h1 className="site-brand">
          <picture>
            <source srcSet="/images/logo-webp.webp" type="image/webp" />
            <img
              className="site-brand-logo"
              src="/images/logo-jpeg.jpeg"
              alt="Dietética Canelo"
              width={304}
              height={80}
            />
          </picture>
        </h1>

        {isAdmin && (
          <nav className="header-tabs" role="tablist" aria-label="Vistas de la tienda">
            <button
              type="button"
              role="tab"
              className={`header-tab ${activeView === "catalogo" ? "active" : ""}`}
              aria-selected={activeView === "catalogo"}
              onClick={() => setActiveView("catalogo")}
            >
              Catálogo
            </button>
            <button
              type="button"
              role="tab"
              className={`header-tab ${activeView === "gestion" ? "active" : ""}`}
              aria-selected={activeView === "gestion"}
              onClick={() => setActiveView("gestion")}
            >
              Gestión
            </button>
          </nav>
        )}

      </header>

      <main>
        {activeView === "catalogo" && (
          <>
            {catalogLoadStatus === "offline" && products.length > 0 && (
              <div className="catalog-offline-banner" role="status">
                No pudimos conectar con el servidor. Mostrando catálogo local.
              </div>
            )}

            {isCatalogRefreshing && (
              <p className="catalog-refreshing-banner" role="status" aria-live="polite">
                Actualizando catálogo…
              </p>
            )}

            {cartReconcileNotice && (
              <div className="cart-reconcile-banner" role="status" aria-live="polite">
                {cartReconcileNotice}
              </div>
            )}

            <section className="category-admin-section">
          <CatalogCategorySearch
            searchValue={categorySearch}
            onSearchChange={(value) => {
              setCategorySearch(value);
              setSelectedProductId(null);
            }}
            isOpen={isCategorySuggestionsOpen}
            onOpenChange={setIsCategorySuggestionsOpen}
            suggestions={catalogSearchSuggestions}
            hasSuggestions={hasCatalogSearchSuggestions}
            showNoMatches={showSearchNoMatches}
            onSelectCategory={handleCategorySelect}
            onSelectProduct={handleProductSelect}
          >
            <div className="category-scroll" aria-label="Lista de categorías">
              <button
                type="button"
                className={`category-chip ${selectedCategory === "Todas" ? "active" : ""}`}
                onClick={() => handleCategorySelect("Todas")}
              >
                Todas
              </button>
              {visibleCategoryChips.map((category) => (
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
          </CatalogCategorySearch>
        </section>


        <div aria-live="polite" aria-atomic="true" className="catalog-status-region">
          {catalogLoadStatus === "loading" && (
            <div className="catalog-loading" role="status">
              <span className="catalog-loading-spinner" aria-hidden="true" />
              <p>Cargando catálogo…</p>
            </div>
          )}

          {catalogEmptyState && (
            <div className="catalog-empty-panel empty-state">
              <p>{catalogEmptyState.message}</p>
              {catalogEmptyState.actionLabel && (
                <button type="button" className="button" onClick={catalogEmptyState.onAction}>
                  {catalogEmptyState.actionLabel}
                </button>
              )}
            </div>
          )}

          {catalogLoadStatus !== "loading" &&
            !catalogEmptyState &&
            groupedProducts.map(([category, categoryProducts]) => (
              <section key={category} className="category-section">
                <h2>{category}</h2>
                <div className="product-grid">
                  {categoryProducts.map((product) =>
                    product.productType === PRODUCT_TYPE_FLAVOR_LINE ? (
                      <GranolaLineCard
                        key={product.id}
                        line={product}
                        onOpenFlavorPicker={handleOpenFlavorPicker}
                        selectedPresentation={getLinePresentationLabel(product)}
                        onPresentationChange={(label) =>
                          setLinePresentationLabel(product.id, label)
                        }
                      />
                    ) : product.productType === PRODUCT_TYPE_FLAVORED ? (
                      <FlavorLineCard
                        key={product.id}
                        line={product}
                        onAddToCart={handleAddFlavorLineToCart}
                      />
                    ) : (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    )
                  )}
                </div>
              </section>
            ))}
        </div>

            <SiteFooter
              showAdminLink={!isAdmin}
              onAdminAccessClick={handleAdminAccessClick}
            />
          </>
        )}

        {isAdmin && activeView === "gestion" && (
          <AdminPanel
            allCategories={allCategories}
            storeFilterCategories={storeFilterCategories}
            shelfCategories={shelfCategories}
            onMoveShelfCategory={handleMoveShelfCategory}
            productCategoryOptions={productCategoryOptions}
            categoryProductCount={categoryProductCount}
            adminGroupedProducts={adminGroupedProducts}
            expandedAdminCategories={expandedAdminCategories}
            onToggleAdminCategory={toggleAdminCategory}
            onExpandAllCategories={expandAllAdminCategories}
            onCollapseAllCategories={collapseAllAdminCategories}
            isCategoryToolsOpen={isCategoryToolsOpen}
            onToggleCategoryTools={() => setIsCategoryToolsOpen((value) => !value)}
            isAddProductOpen={isAddProductOpen}
            onToggleAddProduct={() => setIsAddProductOpen((value) => !value)}
            newCategory={newCategory}
            onNewCategoryChange={setNewCategory}
            editingCategory={editingCategory}
            editingCategoryValue={editingCategoryValue}
            onEditingCategoryValueChange={setEditingCategoryValue}
            onAddCategory={handleAddCategory}
            categoryAdminError={categoryAdminError}
            onStartEditCategory={handleStartEditCategory}
            onSaveCategory={handleSaveCategory}
            onCancelEditCategory={handleCancelEditCategory}
            onDeleteCategory={handleDeleteCategory}
            newProductName={newProductName}
            onNewProductNameChange={setNewProductName}
            newProductShelfNote={newProductShelfNote}
            onNewProductShelfNoteChange={setNewProductShelfNote}
            newProductType={newProductType}
            onNewProductTypeChange={setNewProductType}
            newProductCategory={newProductCategory}
            onNewProductCategoryChange={setNewProductCategory}
            newProductPresentations={newProductPresentations}
            onNewProductPresentationChange={handleNewProductPresentationChange}
            onAddNewProductPresentation={handleAddNewProductPresentation}
            onRemoveNewProductPresentation={handleRemoveNewProductPresentation}
            newProductVariants={newProductVariants}
            onNewProductVariantChange={handleNewProductVariantChange}
            onAddNewProductVariant={handleAddNewProductVariant}
            onRemoveNewProductVariant={handleRemoveNewProductVariant}
            onNewProductVariantImageFile={handleNewProductVariantImageFile}
            newProductImage={newProductImage}
            onNewProductImageChange={setNewProductImage}
            newProductIsVegan={newProductIsVegan}
            onNewProductIsVeganChange={setNewProductIsVegan}
            newProductIsKeto={newProductIsKeto}
            onNewProductIsKetoChange={setNewProductIsKeto}
            newProductIsGlutenFree={newProductIsGlutenFree}
            onNewProductIsGlutenFreeChange={setNewProductIsGlutenFree}
            onNewProductImageFile={handleNewProductImageFile}
            onAddProduct={handleAddProduct}
            productAdminError={productAdminError}
            adminPendingAction={adminPendingAction}
            isCatalogApiAvailable={isCatalogApiAvailable}
            editingProductId={editingProductId}
            editingProductDraft={editingProductDraft}
            onStartEditProduct={handleStartEditProduct}
            onEditProductField={handleEditProductField}
            onEditProductPresentationField={handleEditProductPresentationField}
            onAddPresentationToDraft={handleAddPresentationToDraft}
            onRemovePresentationFromDraft={handleRemovePresentationFromDraft}
            onEditProductImageFile={handleEditProductImageFile}
            onEditVariantField={handleEditVariantField}
            onAddVariantToDraft={handleAddVariantToDraft}
            onRemoveVariantFromDraft={handleRemoveVariantFromDraft}
            onEditVariantImageFile={handleEditVariantImageFile}
            onSaveEditedProduct={handleSaveEditedProduct}
            onCancelEditProduct={handleCancelEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onLogout={handleAdminLogout}
            normalizeCategoryName={normalizeCategoryName}
            onCatalogRefresh={refreshCatalogFromApi}
            onPendingChange={setAdminPendingAction}
          />
        )}
      </main>

      <button
        className="header-icon-button cart-icon-button floating-cart-button"
        type="button"
        onClick={() => setCartOpen(true)}
        aria-label={`Abrir carrito, ${totals.totalItems} productos`}
      >
        <ShoppingCart aria-hidden="true" />
        {totals.totalItems > 0 && (
          <span
            className={`cart-badge${isCartBadgeBumping ? " cart-badge--bump" : ""}`}
            aria-hidden="true"
            onAnimationEnd={() => setIsCartBadgeBumping(false)}
          >
            {totals.totalItems}
          </span>
        )}
      </button>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setCartOpen(false)}
        items={items}
        totals={totals}
        setQuantity={setQuantity}
        removeItem={removeItem}
        clearCart={clearCart}
        onSavePreviousCart={handleSavePreviousCart}
        previousCartOffer={previousCartOffer}
        onRestorePreviousCart={handleRestorePreviousCart}
        onDismissPreviousCart={handleDismissPreviousCart}
      />

      <FlavorPickerPanel
        isOpen={isFlavorPickerOpen}
        line={activeFlavorLine}
        onClose={handleCloseFlavorPicker}
        onAddToCart={handleAddFlavorLineToCart}
        selectedPresentation={
          activeFlavorLine ? getLinePresentationLabel(activeFlavorLine) : ""
        }
        onPresentationChange={
          activeFlavorLine && flavorLineShowsPresentationsOnCard(activeFlavorLine)
            ? (label) => setLinePresentationLabel(activeFlavorLine.id, label)
            : undefined
        }
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
                <button className="button primary" type="submit" disabled={isAdminLoginPending}>
                  {isAdminLoginPending ? "Ingresando…" : "Ingresar"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      <CartAddToast message={cartAddToastMessage} />

      <ExitConfirmDialog
        isOpen={isExitConfirmOpen}
        onStay={handleStayOnSite}
        onLeave={handleLeaveSite}
      />
    </div>
  );
}
