import crypto from "crypto";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() || "";
}

function getAdminUser() {
  return process.env.ADMIN_USER?.trim().toLowerCase() || "";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function isAdminAuthConfigured() {
  return Boolean(getSessionSecret() && getAdminUser() && getAdminPassword());
}

function safeEqualString(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function validateAdminCredentials(user, password) {
  if (!isAdminAuthConfigured()) {
    return false;
  }

  const normalizedUser = String(user ?? "")
    .trim()
    .toLowerCase();
  const normalizedPassword = String(password ?? "");

  return (
    safeEqualString(normalizedUser, getAdminUser()) &&
    safeEqualString(normalizedPassword, getAdminPassword())
  );
}

export function createAdminToken() {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("admin_auth_not_configured");
  }

  const payload = Buffer.from(
    JSON.stringify({
      sub: "admin",
      exp: Date.now() + SESSION_TTL_MS,
    })
  ).toString("base64url");

  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminToken(token) {
  const secret = getSessionSecret();
  if (!secret || !token) {
    return false;
  }

  const [payload, signature] = String(token).split(".");
  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  if (!safeEqualString(signature, expectedSignature)) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.sub !== "admin" || typeof data.exp !== "number" || data.exp < Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getSessionTtlMs() {
  return SESSION_TTL_MS;
}

export function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7).trim() || null;
}
