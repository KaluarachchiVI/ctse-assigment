/**
 * Decode JWT payload (client-side only; does not verify signature).
 * Returns `sub` claim when present (common for user id).
 */
export function decodeJwtSub(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    let base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const json = atob(base64);
    const data = JSON.parse(json) as Record<string, unknown>;
    const sub = data.sub ?? data.userId;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}
