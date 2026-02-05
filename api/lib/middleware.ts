import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── CORS ──────────────────────────────────────────────────────────────────────
// Allowed origins for API requests. In production, restrict to your domain(s).
const ALLOWED_ORIGINS = [
  'https://mymarineforecast.com',
  'https://www.mymarineforecast.com',
];

// In non-production environments, also allow localhost and Vercel preview URLs
if (process.env.VERCEL_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:5173');
  // Add the current Vercel preview URL if available
  if (process.env.VERCEL_URL) {
    ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_URL}`);
  }
}

/**
 * Set CORS headers on the response.
 * Returns true if this was a preflight (OPTIONS) request that was handled.
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

// ─── Auth Verification ─────────────────────────────────────────────────────────

/**
 * Verify the Supabase JWT from the Authorization header and ensure the
 * authenticated user matches the userId in the request body.
 *
 * Returns the verified userId on success, or null if verification fails
 * (after sending an error response).
 */
export async function verifyAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<string | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables for auth verification');
    res.status(500).json({ error: 'Server configuration error' });
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }

  // Verify that the userId in the request body matches the authenticated user
  const bodyUserId = req.body?.userId;
  if (bodyUserId && bodyUserId !== user.id) {
    res.status(403).json({ error: 'User ID mismatch' });
    return null;
  }

  return user.id;
}

// ─── Input Validation Helpers ──────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

export function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validate that a Stripe price ID matches one of the expected price IDs
 * configured in environment variables.
 */
export function isValidPriceId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const allowedPriceIds = [
    process.env.VITE_STRIPE_MONTHLY_PRICE_ID,
    process.env.VITE_STRIPE_ANNUAL_PRICE_ID,
  ].filter(Boolean);
  return allowedPriceIds.includes(value);
}

export function isValidTrialDays(value: unknown): value is number {
  if (value === undefined || value === null) return true; // optional
  if (typeof value !== 'number') return false;
  return Number.isInteger(value) && value >= 0 && value <= 14;
}

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
// Simple in-memory rate limiter. Each Vercel serverless function instance
// maintains its own map, so this is approximate but still effective at stopping
// abuse from a single source. For stricter limits, use an external store (Redis).

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up stale entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Apply rate limiting based on a key (typically IP or userId).
 *
 * @param key - The identifier to rate limit (IP address, user ID, etc.)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if the request should be allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  cleanupRateLimitMap();

  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count++;
  return entry.count <= maxRequests;
}

/**
 * Get the client IP from a Vercel request.
 */
export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}
