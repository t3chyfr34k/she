import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sign(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function sameText(a: string, b: string) {
  // Hash first so lengths match and nothing leaks through timing.
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

export function passwordMatches(input: string, expected: string) {
  return sameText(input, expected);
}

/** A signed, expiring admin pass: "<expiresAt>.<signature>". */
export function signAdminToken(secret: string, now = Date.now()) {
  const exp = now + ADMIN_TOKEN_TTL_MS;
  return `${exp}.${sign(secret, `admin:${exp}`)}`;
}

export function verifyAdminToken(token: unknown, secret: string | undefined, now = Date.now()) {
  if (!secret || typeof token !== "string") return false;
  const [expText, sig] = token.split(".");
  const exp = Number(expText);
  if (!expText || !sig || !Number.isFinite(exp) || exp < now) return false;
  return sameText(sig, sign(secret, `admin:${exp}`));
}
