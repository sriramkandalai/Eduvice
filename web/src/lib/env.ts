/** Read a required environment variable at call time (never at import time, so builds don't need secrets). */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function envOr(name: string, fallback: string): string {
  return process.env[name] || fallback;
}
