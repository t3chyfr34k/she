import { createHmac } from "node:crypto";
import { passwordMatches } from "./admin-token.server";

const ACCESS_TTL_MS = 30 * 60 * 1000;

function sign(secret: string, expiresAt: number): string {
  return createHmac("sha256", secret).update(`birthday-access:${expiresAt}`).digest("hex");
}

export function issueBirthdayAccessToken(secret: string, now = Date.now()): string {
  const expiresAt = now + ACCESS_TTL_MS;
  return `${expiresAt}.${sign(secret, expiresAt)}`;
}

export function hasBirthdayAccess(
  token: unknown,
  secret = process.env["BIRTHDAY_ACCESS_SECRET"],
  now = Date.now(),
): boolean {
  if (typeof token !== "string" || !secret) return false;
  const [expiresText, signature] = token.split(".");
  const expiresAt = Number(expiresText);
  if (!expiresText || !signature || !Number.isFinite(expiresAt) || expiresAt < now) return false;
  return passwordMatches(signature, sign(secret, expiresAt));
}

export function verifyBirthdayPasscode(input: unknown): boolean {
  const expected = process.env["BIRTHDAY_PASSCODE"];
  return Boolean(expected && typeof input === "string" && passwordMatches(input, expected));
}
