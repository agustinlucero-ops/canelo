import { ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminPanel from "./components/AdminPanel";
import ProductCard from "./components/ProductCard";
import CartDrawer from "./components/CartDrawer";
import { useCart } from "./context/CartContext";
import useBodyScrollLock from "./hooks/useBodyScrollLock";
import { fetchCatalogFromApi } from "./api/catalog";
import {
  createCategory as createCategoryApi,
  createProduct as createProductApi,
  deleteCategory as deleteCategoryApi,
  deleteProduct as deleteProductApi,
  renameCategory as renameCategoryApi,
  updateProduct as updateProductApi,
} from "./api/adminCatalog";
import initialProducts from "./data/products.json";
import { normalizeProductName } from "./utils/productName";
import {
  GLUTEN_FREE_FILTER_CATEGORY,
  KETO_FILTER_CATEGORY,
  VEGAN_FILTER_CATEGORY,
  getProductCategoryOptions,
  isGlutenFreeFilterCategory,
  isKetoFilterCategory,
  isVeganFilterCategory,
  resolveProductCategoryAndVegan,
} from "./utils/productCategories";

const CATEGORIES_STORAGE_KEY = "canelo.categories";
const PRODUCTS_STORAGE_KEY = "canelo.products";
const PRODUCTS_VERSION_STORAGE_KEY = "canelo.products-version";
const PRODUCTS_DATA_VERSION = 11;
const ADMIN_SESSION_STORAGE_KEY = "canelo.admin-session";
const ADMIN_USER = "dieteticacanelo@gmail.com";
const ADMIN_PASSWORD = "TagaBodoque";
const DEFAULT_PRODUCT_IMAGE = "/images/products/almendra.svg";
const ENABLE_REMOTE_ADMIN_WRITES = import.meta.env.VITE_ENABLE_REMOTE_ADMIN_WRITES !== "false";

const DEFAULT_CATEGORIES = [
  GLUTEN_FREE_FILTER_CATEGORY,
  "Granolas",
  KETO_FILTER_CATEGORY,
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
      const { category, isVegan, isKeto, isGlutenFree } = resolveProductCategoryAndVegan(
        product,
        normalizedCategory
      );
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
        isKeto,
        isGlutenFree,
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
  const [categoryAdminError, setCategoryAdminError] = useState("");
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
  const [activeView, setActiveView] = useState("catalogo");
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [expandedAdminCategories, setExpandedAdminCategories] = useState(() => new Set());
  const [isCategoryToolsOpen, setIsCategoryToolsOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Sin tacc");
  const [newProductPresentation, setNewProductPresentation] = useState("1kg");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductIsVegan, setNewProductIsVegan] = useState(false);
  const [newProductIsKeto, setNewProductIsKeto] = useState(false);
  const [newProductIsGlutenFree, setNewProductIsGlutenFree] = useState(false);
  const [newProductImage, setNewProductImage] = useState("");
  const [productAdminError, setProductAdminError] = useState("");
  const [adminPendingAction, setAdminPendingAction] = useState("");
  const [isCatalogApiAvailable, setIsCatalogApiAvailable] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProductDraft, setEditingProductDraft] = useState(null);

  const isProductEditModalOpen = Boolean(editingProductId && editingProductDraft);
  useBodyScrollLock(isCartOpen || isAdminModalOpen || isProductEditModalOpen);

  const mergeApiCatalogInState = useCallback(({ categories: apiCategories, products: apiProducts }) => {
    const sanitizedProducts = sanitizeProducts(apiProducts);
    setProducts(sanitizedProducts);
    if (apiCategories.length) {
      setCategories((currentCategories) => [...new Set([...currentCategories, ...apiCategories])]);
    }
    return sanitizedProducts.length > 0 || apiCategories.length > 0;
  }, []);

  const refreshCatalogFromApi = useCallback(async () => {
    try {
      const apiCatalog = await fetchCatalogFromApi();
      const hasData = mergeApiCatalogInState(apiCatalog);
      setIsCatalogApiAvailable(true);
      return hasData;
    } catch {
      setIsCatalogApiAvailable(false);
      return false;
    }
  }, [mergeApiCatalogInState]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const hasData = await refreshCatalogFromApi();
      if (cancelled || hasData) return;
      // Mantiene catálogo de localStorage / products.json cuando la API no está disponible
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
    if (isGlutenFreeFilterCategory(selectedCategory)) {
      return products.filter((product) => product.isGlutenFree);
    }
    if (isKetoFilterCategory(selectedCategory)) {
      return products.filter((product) => product.isKeto);
    }
    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

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
      if (product.isKeto) {
        acc[KETO_FILTER_CATEGORY] = (acc[KETO_FILTER_CATEGORY] ?? 0) + 1;
      }
      if (product.isGlutenFree && !isGlutenFreeFilterCategory(normalizedCategory)) {
        acc[GLUTEN_FREE_FILTER_CATEGORY] = (acc[GLUTEN_FREE_FILTER_CATEGORY] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [products]);

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
      await refreshCatalogFromApi();
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
      await refreshCatalogFromApi();
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
      await refreshCatalogFromApi();
      if (selectedCategory === categoryToDelete) {
        setSelectedCategory("Todas");
      }
    }).catch((err) => {
      setCategoryAdminError(err?.message || "No se pudo eliminar la categoría.");
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

  const handleAddProduct = async () => {
    if (!ensureCatalogApiWritable()) return;

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
      isKeto: newProductIsKeto,
      isGlutenFree:
        newProductIsGlutenFree || isGlutenFreeFilterCategory(normalizedCategory),
      outOfStock: false,
      presentations: [
        {
          label: normalizedPresentation,
          price: Math.round(normalizedPrice),
        },
      ],
    };

    await withAdminPendingAction("add-product", async () => {
      await createProductApi(nextProduct);
      await refreshCatalogFromApi();
      expandAdminCategory(normalizedCategory);
      setNewProductName("");
      setNewProductCategory("Sin tacc");
      setNewProductIsVegan(false);
      setNewProductIsKeto(false);
      setNewProductIsGlutenFree(false);
      setNewProductPresentation("1kg");
      setNewProductPrice("");
      setNewProductImage("");
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
      await refreshCatalogFromApi();
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
      isVegan: Boolean(product.isVegan),
      isKeto: Boolean(product.isKeto),
      isGlutenFree: Boolean(product.isGlutenFree),
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

    const updatedProduct = {
      id: editingProductDraft.id,
      name: normalizedName,
      category: normalizedCategory,
      image: editingProductDraft.image.trim() || DEFAULT_PRODUCT_IMAGE,
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
    };

    await withAdminPendingAction("update-product", async () => {
      await updateProductApi(productId, updatedProduct);
      await refreshCatalogFromApi();
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

  const handleAdminLogin = (event) => {
    event.preventDefault();
    const normalizedUser = adminUserInput.trim().toLowerCase();

    if (normalizedUser === ADMIN_USER && adminPasswordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setActiveView("gestion");
      setExpandedAdminCategories(new Set());
      setIsCategoryToolsOpen(false);
      setIsAddProductOpen(false);
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
          <img className="site-brand-logo" src="/images/Logo CANELO.svg" alt="Canelo" />
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
            {!isAdmin && (
              <section className="category-admin-section">
                <button
                  type="button"
                  className="admin-access-link"
                  onClick={handleAdminAccessClick}
                >
                  Ingresar admin
                </button>
              </section>
            )}

            <section className="category-admin-section">
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
          </>
        )}

        {isAdmin && activeView === "gestion" && (
          <AdminPanel
            allCategories={allCategories}
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
            newProductCategory={newProductCategory}
            onNewProductCategoryChange={setNewProductCategory}
            newProductPresentation={newProductPresentation}
            onNewProductPresentationChange={setNewProductPresentation}
            newProductPrice={newProductPrice}
            onNewProductPriceChange={setNewProductPrice}
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
            onSaveEditedProduct={handleSaveEditedProduct}
            onCancelEditProduct={handleCancelEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onLogout={handleAdminLogout}
            normalizeCategoryName={normalizeCategoryName}
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
          <span className="cart-badge" aria-hidden="true">
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
