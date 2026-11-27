import { createHmac, createHash, timingSafeEqual } from "node:crypto";

const PHOTO_WALL_ACCESS_TTL_MS = 30 * 60 * 1000;
const PROTECTED_MONGODB_HOST = "she.wniatmk.mongodb.net";
const PROTECTED_MONGODB_DATABASE = "birthday_site";

/** Protect the wall only when this app is connected to the configured birthday cluster. */
export function isPhotoWallProtectionEnabled(uri = process.env["MONGODB_URI"]) {
  if (!uri) return false;
  try {
    const parsed = new URL(uri);
    const database = decodeURIComponent(parsed.pathname.slice(1).split("/")[0] ?? "") || "birthday_site";
    return (
      parsed.hostname.toLowerCase() === PROTECTED_MONGODB_HOST &&
      database === PROTECTED_MONGODB_DATABASE
    );
  } catch {
    return false;
  }
}

function sameText(left: string, right: string) {
  const leftHash = createHash("sha256").update(left, "utf8").digest();
  const rightHash = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(leftHash, rightHash);
}

function sign(secret: string, expiresAt: number) {
  return createHmac("sha256", secret)
    .update(`photo-wall-access:${expiresAt}`)
    .digest("hex");
}

export function issuePhotoWallAccessToken(secret: string, now = Date.now()) {
  const expiresAt = now + PHOTO_WALL_ACCESS_TTL_MS;
  return `${expiresAt}.${sign(secret, expiresAt)}`;
}

export function hasPhotoWallAccess(token: unknown, secret = process.env["SESSION_SECRET"], now = Date.now()) {
  if (typeof token !== "string" || !secret) return false;
  const [expiresText, signature] = token.split(".");
  const expiresAt = Number(expiresText);
  if (!expiresText || !signature || !Number.isFinite(expiresAt) || expiresAt < now) return false;
  return sameText(signature, sign(secret, expiresAt));
}
