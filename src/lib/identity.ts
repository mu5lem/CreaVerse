export const PLACEHOLDER_EMAIL_DOMAIN = "users.creaverse.local";

/** Lowercased, email-safe username. */
export function normalizeUsername(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

export function placeholderEmailFor(username: string) {
  return `${normalizeUsername(username)}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

export function isPlaceholderEmail(email?: string | null) {
  return !!email && email.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
}

/** Basic shape check only — deliverability is never validated. */
export function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Resolve a login identifier ("email or username") into the address that
 * Supabase Auth should be called with, plus the username when applicable.
 */
export function resolveIdentifier(raw: string): { email: string; username: string | null } {
  const value = raw.trim();
  if (value.includes("@")) return { email: value.toLowerCase(), username: null };
  const username = normalizeUsername(value);
  return { email: placeholderEmailFor(username), username };
}
