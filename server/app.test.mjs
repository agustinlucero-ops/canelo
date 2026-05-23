import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  enableMemoryImportDraftForTests,
  resetMemoryImportDraftForTests,
} from "./catalogImportDraft.mjs";

const previousEnv = {
  ADMIN_USER: process.env.ADMIN_USER,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
};

before(() => {
  process.env.ADMIN_USER = "test@canelo.local";
  process.env.ADMIN_PASSWORD = "test-password-123";
  process.env.ADMIN_SESSION_SECRET = "test-session-secret-with-32-chars-min";
  delete process.env.DATABASE_URL;
});

after(() => {
  process.env.ADMIN_USER = previousEnv.ADMIN_USER;
  process.env.ADMIN_PASSWORD = previousEnv.ADMIN_PASSWORD;
  process.env.ADMIN_SESSION_SECRET = previousEnv.ADMIN_SESSION_SECRET;
  if (previousEnv.DATABASE_URL) {
    process.env.DATABASE_URL = previousEnv.DATABASE_URL;
  } else {
    delete process.env.DATABASE_URL;
  }
});

describe("admin auth routes", () => {
  it("rejects invalid login", async () => {
    const { default: app } = await import("./app.mjs");
    const server = app.listen(0);
    const { port } = server.address();

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: "wrong", password: "wrong" }),
      });

      assert.equal(response.status, 401);
    } finally {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it("returns token for valid login and validates session", async () => {
    const { default: app } = await import("./app.mjs");
    const server = app.listen(0);
    const { port } = server.address();

    try {
      const loginResponse = await fetch(`http://127.0.0.1:${port}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: "test@canelo.local",
          password: "test-password-123",
        }),
      });

      assert.equal(loginResponse.status, 200);
      const loginPayload = await loginResponse.json();
      assert.ok(loginPayload.token);

      const sessionResponse = await fetch(`http://127.0.0.1:${port}/api/admin/session`, {
        headers: { Authorization: `Bearer ${loginPayload.token}` },
      });

      assert.equal(sessionResponse.status, 200);
      const sessionPayload = await sessionResponse.json();
      assert.equal(sessionPayload.ok, true);
    } finally {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });
});

describe("catalog import routes", () => {
  before(() => {
    enableMemoryImportDraftForTests();
  });

  after(() => {
    resetMemoryImportDraftForTests();
  });

  async function loginAdmin(port) {
    const loginResponse = await fetch(`http://127.0.0.1:${port}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: "test@canelo.local",
        password: "test-password-123",
      }),
    });
    const payload = await loginResponse.json();
    return payload.token;
  }

  it("admin puede cargar filas excel al borrador y consultarlo", async () => {
    const { default: app } = await import("./app.mjs");
    const server = app.listen(0);
    const { port } = server.address();

    try {
      const token = await loginAdmin(port);

      const parseResponse = await fetch(`http://127.0.0.1:${port}/api/admin/catalog/import/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rows: [
            {
              categoria: "Frutos secos",
              nombre: "Nuez pecan",
              precio: 8500,
              presentacion: "500g",
            },
          ],
          importMode: "new_products_only",
          updateExisting: false,
          sourceFilename: "marzo.xlsx",
        }),
      });

      assert.equal(parseResponse.status, 201);
      const parsePayload = await parseResponse.json();
      assert.equal(parsePayload.summary.toCreate, 1);

      const draftResponse = await fetch(`http://127.0.0.1:${port}/api/admin/catalog/import/draft`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(draftResponse.status, 200);
      const draftPayload = await draftResponse.json();
      assert.equal(draftPayload.draft.items.length, 1);
      assert.equal(draftPayload.draft.items[0].payload.name, "Nuez pecan");
    } finally {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it("admin puede importar PDF como texto y editar un ítem del borrador", async () => {
    const { default: app } = await import("./app.mjs");
    const server = app.listen(0);
    const { port } = server.address();

    try {
      const token = await loginAdmin(port);
      const pdfText = ["FRUTOS SECOS", "Nuez pecan 8500"].join("\n");

      const parseResponse = await fetch(
        `http://127.0.0.1:${port}/api/admin/catalog/import/parse-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pdfText,
            importMode: "new_products_only",
            sourceFilename: "marzo.pdf",
          }),
        }
      );

      assert.equal(parseResponse.status, 201);

      const draftResponse = await fetch(`http://127.0.0.1:${port}/api/admin/catalog/import/draft`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const draftPayload = await draftResponse.json();
      const itemId = draftPayload.draft.items[0].id;

      const patchResponse = await fetch(
        `http://127.0.0.1:${port}/api/admin/catalog/import/items/${itemId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: "Nuez pecan premium",
            presentations: [{ label: "1u", price: 9200 }],
          }),
        }
      );

      assert.equal(patchResponse.status, 200);
      const patchPayload = await patchResponse.json();
      assert.equal(patchPayload.item.payload.name, "Nuez pecan premium");
    } finally {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it("admin puede descartar el borrador activo", async () => {
    const { default: app } = await import("./app.mjs");
    const server = app.listen(0);
    const { port } = server.address();

    try {
      const token = await loginAdmin(port);

      await fetch(`http://127.0.0.1:${port}/api/admin/catalog/import/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rows: [{ categoria: "Varios", nombre: "Stevia", precio: 3200 }],
          importMode: "new_products_only",
        }),
      });

      const discardResponse = await fetch(
        `http://127.0.0.1:${port}/api/admin/catalog/import/discard`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      assert.equal(discardResponse.status, 200);

      const draftResponse = await fetch(`http://127.0.0.1:${port}/api/admin/catalog/import/draft`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const draftPayload = await draftResponse.json();
      assert.equal(draftPayload.draft, null);
    } finally {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });
});
