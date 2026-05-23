import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createImportDraftFromRows,
  enableMemoryImportDraftForTests,
  getActiveImportDraft,
  publishImportDraft,
  resetMemoryImportDraftForTests,
  updateImportDraftItem,
  renameImportDraftCategory,
  discardActiveImportDraft,
  createImportDraftFromPdfText,
} from "./catalogImportDraft.mjs";

function createRecordingCatalogDeps({ failOnAppliedCount } = {}) {
  const state = {
    categories: [],
    products: [],
    applied: [],
  };

  return {
    async listCategories() {
      return state.categories;
    },
    async createCategory({ name }) {
      state.categories.push({ name });
      state.applied.push(["category", name]);
    },
    async createProduct(product) {
      if (failOnAppliedCount !== undefined && state.applied.length + 1 === failOnAppliedCount) {
        throw new Error("fallo simulado de publicación");
      }
      state.products.push(product);
      state.applied.push(["create", product.name]);
    },
    async updateProduct(id, product) {
      state.products = state.products.map((entry) => (entry.id === id ? product : entry));
      state.applied.push(["update", product.name]);
    },
    async runInTransaction(callback) {
      const snapshot = structuredClone(state);
      try {
        return await callback();
      } catch (error) {
        state.categories = snapshot.categories;
        state.products = snapshot.products;
        state.applied = snapshot.applied;
        throw error;
      }
    },
    state,
  };
}

describe("createImportDraftFromRows", () => {
  before(() => {
    enableMemoryImportDraftForTests();
  });

  after(() => {
    resetMemoryImportDraftForTests();
  });

  it("crea un borrador activo con productos nuevos listos para revisar", async () => {
    const result = await createImportDraftFromRows({
      rows: [
        {
          categoria: "Frutos secos",
          nombre: "Nuez pecan",
          precio: 8500,
          presentacion: "500g",
        },
      ],
      liveProducts: [],
      liveCategories: ["Sin tacc"],
      importMode: "new_products_only",
      updateExisting: false,
      sourceFilename: "marzo.xlsx",
    });

    assert.ok(result.batchId);
    assert.equal(result.summary.toCreate, 1);
    assert.equal(result.summary.skipped, 0);

    const draft = await getActiveImportDraft();
    assert.equal(draft.batch.importMode, "new_products_only");
    assert.equal(draft.items.length, 1);
    assert.equal(draft.items[0].action, "create");
    assert.equal(draft.items[0].payload.name, "Nuez pecan");
  });
});

describe("publishImportDraft", () => {
  before(() => {
    enableMemoryImportDraftForTests();
  });

  after(() => {
    resetMemoryImportDraftForTests();
  });

  it("publica el borrador al catálogo en línea y lo cierra", async () => {
    const catalog = createRecordingCatalogDeps();

    await createImportDraftFromRows({
      rows: [
        {
          categoria: "Frutos secos",
          nombre: "Nuez pecan",
          precio: 8500,
          presentacion: "500g",
        },
      ],
      liveProducts: [],
      liveCategories: [],
      importMode: "new_products_only",
      updateExisting: false,
    });

    const result = await publishImportDraft(catalog);

    assert.equal(result.created, 1);
    assert.deepEqual(catalog.state.applied, [
      ["category", "Frutos secos"],
      ["create", "Nuez pecan"],
    ]);
    assert.equal(await getActiveImportDraft(), null);
  });

  it("no deja cambios parciales si falla la publicación", async () => {
    const catalog = createRecordingCatalogDeps({ failOnAppliedCount: 2 });

    await createImportDraftFromRows({
      rows: [
        {
          categoria: "Frutos secos",
          nombre: "Nuez pecan",
          precio: 8500,
        },
      ],
      liveProducts: [],
      liveCategories: [],
      importMode: "new_products_only",
      updateExisting: false,
    });

    await assert.rejects(() => publishImportDraft(catalog), /fallo simulado/);
    assert.equal(catalog.state.applied.length, 0);
    assert.equal(catalog.state.products.length, 0);
    const draft = await getActiveImportDraft();
    assert.equal(draft.items.length, 1);
  });
});

describe("updateImportDraftItem", () => {
  before(() => {
    enableMemoryImportDraftForTests();
  });

  after(() => {
    resetMemoryImportDraftForTests();
  });

  it("actualiza un producto del borrador antes de publicar", async () => {
    await createImportDraftFromRows({
      rows: [
        {
          categoria: "Frutos secos",
          nombre: "Nuez pecan",
          precio: 8500,
          presentacion: "500g",
        },
      ],
      liveProducts: [],
      liveCategories: [],
      importMode: "new_products_only",
      updateExisting: false,
    });

    const draft = await getActiveImportDraft();
    const itemId = draft.items[0].id;

    const updated = await updateImportDraftItem(itemId, {
      name: "Nuez pecan premium",
      presentations: [{ label: "500g", price: 9200 }],
    });

    assert.equal(updated.payload.name, "Nuez pecan premium");
    assert.equal(updated.payload.presentations[0].price, 9200);

    const refreshed = await getActiveImportDraft();
    assert.equal(refreshed.items[0].payload.name, "Nuez pecan premium");
  });
});

describe("renameImportDraftCategory", () => {
  before(() => {
    enableMemoryImportDraftForTests();
  });

  after(() => {
    resetMemoryImportDraftForTests();
  });

  it("renombra una categoría en bloque dentro del borrador", async () => {
    await createImportDraftFromRows({
      rows: [
        { categoria: "Frutos secoss", nombre: "Nuez pecan", precio: 8500 },
        { categoria: "Frutos secoss", nombre: "Almendra", precio: 4200 },
        { categoria: "Varios", nombre: "Stevia", precio: 3200 },
      ],
      liveProducts: [],
      liveCategories: [],
      importMode: "new_products_only",
      updateExisting: false,
    });

    const result = await renameImportDraftCategory("Frutos secoss", "Frutos secos");
    assert.equal(result.updatedItems, 2);

    const draft = await getActiveImportDraft();
    const categories = draft.items.map((item) => item.payload.category);
    assert.deepEqual(categories, ["Frutos secos", "Frutos secos", "Varios"]);
  });
});

describe("discardActiveImportDraft", () => {
  before(() => {
    enableMemoryImportDraftForTests();
  });

  after(() => {
    resetMemoryImportDraftForTests();
  });

  it("descarta el borrador sin publicar al catálogo en línea", async () => {
    await createImportDraftFromRows({
      rows: [{ categoria: "Varios", nombre: "Stevia", precio: 3200 }],
      liveProducts: [],
      liveCategories: [],
      importMode: "new_products_only",
      updateExisting: false,
    });

    await discardActiveImportDraft();
    assert.equal(await getActiveImportDraft(), null);

    await assert.rejects(
      () => publishImportDraft(createRecordingCatalogDeps()),
      (error) => error.code === "no_active_draft"
    );
  });
});

describe("createImportDraftFromPdfText", () => {
  before(() => {
    enableMemoryImportDraftForTests();
  });

  after(() => {
    resetMemoryImportDraftForTests();
  });

  it("crea borrador desde texto extraído de un archivo de catálogo PDF", async () => {
    const pdfText = ["FRUTOS SECOS", "Nuez pecan 8500", "Varios", "Stevia 3200"].join("\n");

    const result = await createImportDraftFromPdfText({
      pdfText,
      liveProducts: [],
      liveCategories: ["Sin tacc"],
      importMode: "new_products_only",
      updateExisting: false,
      sourceFilename: "marzo.pdf",
    });

    assert.equal(result.summary.toCreate, 2);
    const draft = await getActiveImportDraft();
    assert.equal(draft.items.length, 2);
    assert.equal(draft.batch.sourceFilename, "marzo.pdf");
  });
});
