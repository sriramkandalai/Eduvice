import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "./password-rules";

export { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH };

// Passwords are hashed with scrypt (built into Node): a random salt per password and a
// memory-hard key derivation. Stored format: scrypt$N$r$p$<salt base64>$<hash base64>

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;


function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { ...options, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

/** Used when no account exists, so a failed sign-in takes about as long either way. */
const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(KEY_LENGTH).toString("base64");

export async function verifyPassword(password: string, stored: string | undefined | null): Promise<boolean> {
  const parts = (stored ?? DUMMY_HASH).split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts as [string, string, string, string, string, string];
  const expected = Buffer.from(hashB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"), { N: Number(n), r: Number(r), p: Number(p) });
  return stored != null && actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function isValidPassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH
  );
}

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const e = email.trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}
