/**
 * security.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side security utilities:
 *   1. In-memory rate limiter  — max N attempts per window (ms)
 *   2. Input sanitizer         — strips dangerous HTML / control characters
 *   3. Payload validator       — enforces max field lengths / rejects oversized data
 *
 * NOTE: This is a static front end (React + Vite). Accounts and saved data
 * go to Supabase, whose Auth server enforces its own rate limits and whose
 * database enforces the RLS policies and constraints in supabase/migrations.
 * These utilities add a UX-layer defence-in-depth on top of that.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── 1. Rate Limiter ──────────────────────────────────────────────────────────

interface RateLimitEntry {
  attempts: number;
  windowStart: number;
}

const _store = new Map<string, RateLimitEntry>();

/**
 * Returns true if the action is ALLOWED, false if the rate limit is exceeded.
 *
 * @param key        Unique identifier for the action (e.g. "auth:login")
 * @param maxAttempts  Maximum allowed attempts within the window
 * @param windowMs   Time window in milliseconds (default: 15 minutes)
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  const entry = _store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    // First attempt or window expired — reset
    _store.set(key, { attempts: 1, windowStart: now });
    return true;
  }

  if (entry.attempts >= maxAttempts) {
    return false; // Blocked
  }

  entry.attempts += 1;
  return true;
}

/**
 * Returns the number of seconds remaining in the current rate-limit window.
 * Returns 0 if the window has expired or no entry exists.
 */
export function getRateLimitCooldown(
  key: string,
  windowMs: number = 15 * 60 * 1000
): number {
  const entry = _store.get(key);
  if (!entry) return 0;
  const elapsed = Date.now() - entry.windowStart;
  const remaining = windowMs - elapsed;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/**
 * Manually reset a rate-limit key (e.g. after a successful auth).
 */
export function resetRateLimit(key: string): void {
  _store.delete(key);
}

// ─── 2. Input Sanitizer ───────────────────────────────────────────────────────

/**
 * Strips HTML tags, null bytes, and trims whitespace.
 * Safe for use on any text field before display or SDK submission.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/\0/g, "")                         // null bytes
    .replace(/<[^>]*>/g, "")                    // HTML tags
    .replace(/javascript:/gi, "")              // inline JS URIs
    .replace(/on\w+\s*=/gi, "")               // inline event handlers
    .trim();
}

/**
 * Sanitizes a URL: only allows http/https schemes.
 * Returns null if the URL is invalid or uses a dangerous scheme.
 */
export function sanitizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Turns HTML character references ("&amp;", "&#39;", "&mdash;") into the
 * characters they stand for, and returns plain text for React to render.
 *
 * The site's curated copy carries a few of these, and it used to be shown
 * with dangerouslySetInnerHTML only so they would decode - which also meant
 * any tag that ever reached those strings would run. This does the one job
 * without parsing HTML at all: tags stay literal text, and React escapes the
 * result like any other string.
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", middot: "·",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  deg: "°", times: "×", minus: "−", euro: "€", pound: "£",
};

export function decodeEntities(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref[0] === "#") {
      const code = ref[1] === "x" || ref[1] === "X" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      // Out-of-range and surrogate code points would throw or produce garbage.
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff)
        ? String.fromCodePoint(code)
        : whole;
    }
    return NAMED_ENTITIES[ref.toLowerCase()] ?? whole;
  });
}

// ─── 3. Payload Validator ─────────────────────────────────────────────────────

export const LIMITS = {
  NOTE_TITLE:    120,   // characters
  NOTE_CONTENT:  10_000,
  NOTE_LINK_URL: 2_048,
  NOTE_MAX_LINKS: 10,
  EMAIL:         254,   // RFC 5321
  NAME:          100,
  SEARCH_QUERY:  200,
} as const;

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function validateNotePayload(payload: {
  title?: string;
  content: string;
  links?: string[];
}): ValidationResult {
  if (!payload.content || payload.content.trim().length === 0) {
    return { ok: false, message: "Note content cannot be empty." };
  }
  if (payload.content.length > LIMITS.NOTE_CONTENT) {
    return { ok: false, message: `Note content exceeds the ${LIMITS.NOTE_CONTENT.toLocaleString()}-character limit.` };
  }
  if (payload.title && payload.title.length > LIMITS.NOTE_TITLE) {
    return { ok: false, message: `Title exceeds the ${LIMITS.NOTE_TITLE}-character limit.` };
  }
  if (payload.links) {
    if (payload.links.length > LIMITS.NOTE_MAX_LINKS) {
      return { ok: false, message: `You can attach at most ${LIMITS.NOTE_MAX_LINKS} links per note.` };
    }
    for (const url of payload.links) {
      if (url.length > LIMITS.NOTE_LINK_URL) {
        return { ok: false, message: "One or more URLs exceed the 2,048-character limit." };
      }
      if (sanitizeUrl(url) === null) {
        return { ok: false, message: `Invalid URL: "${url.slice(0, 60)}…"` };
      }
    }
  }
  return { ok: true };
}

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { ok: false, message: "Email is required." };
  }
  if (email.length > LIMITS.EMAIL) {
    return { ok: false, message: "Email address is too long." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  return { ok: true };
}
