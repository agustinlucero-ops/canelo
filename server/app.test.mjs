import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";

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
