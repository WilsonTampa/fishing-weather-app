import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  handleCors,
  checkRateLimit,
  getClientIp,
} from '../lib/middleware.js';

// Admin email whitelist — only these users can access this endpoint
const ADMIN_EMAILS = ['stevewilsontampa@gmail.com'];

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — also allow GET for this endpoint
  if (handleCors(req, res)) return;
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[admin/users] Missing env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Rate limit: 10 requests per IP per 5 minutes
  const ip = getClientIp(req);
  if (!checkRateLimit(`admin:${ip}`, 10, 5 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // ── Authenticate the caller ──
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Verify the JWT and get the user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // ── Admin check ──
  if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // ── Fetch all profiles with their subscriptions ──
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('[admin/users] Error fetching profiles:', profilesError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('user_id, tier, status, trial_ends_at, current_period_end, cancel_at_period_end, created_at');

    if (subsError) {
      console.error('[admin/users] Error fetching subscriptions:', subsError);
      return res.status(500).json({ error: 'Failed to fetch subscription data' });
    }

    // Fetch saved location counts per user
    const { data: locations, error: locError } = await supabase
      .from('saved_locations')
      .select('user_id');

    if (locError) {
      console.error('[admin/users] Error fetching locations:', locError);
      return res.status(500).json({ error: 'Failed to fetch location data' });
    }

    // Get auth user metadata (last sign-in) using admin API
    const { data: { users: authUsers }, error: authUsersError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authUsersError) {
      console.error('[admin/users] Error fetching auth users:', authUsersError);
      // Continue without last sign-in data rather than failing
    }

    // Build lookup maps
    const subsByUserId = new Map(
      (subscriptions || []).map(s => [s.user_id, s])
    );

    const locationCountByUserId = new Map<string, number>();
    for (const loc of (locations || [])) {
      locationCountByUserId.set(
        loc.user_id,
        (locationCountByUserId.get(loc.user_id) || 0) + 1
      );
    }

    const authUserById = new Map(
      (authUsers || []).map(u => [u.id, u])
    );

    // ── Build user list ──
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let freeCount = 0;
    let trialCount = 0;
    let paidCount = 0;
    let signupsToday = 0;
    let signupsThisWeek = 0;

    const userList = (profiles || []).map(profile => {
      const sub = subsByUserId.get(profile.id);
      const authUser = authUserById.get(profile.id);
      const locationCount = locationCountByUserId.get(profile.id) || 0;

      const tier = sub?.tier || 'free';
      const status = sub?.status || 'free';

      // Count tiers
      if (tier === 'paid') paidCount++;
      else if (tier === 'trial') trialCount++;
      else freeCount++;

      // Count signups
      const createdAt = new Date(profile.created_at);
      if (createdAt >= oneDayAgo) signupsToday++;
      if (createdAt >= sevenDaysAgo) signupsThisWeek++;

      return {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        tier,
        status,
        trialEndsAt: sub?.trial_ends_at || null,
        currentPeriodEnd: sub?.current_period_end || null,
        cancelAtPeriodEnd: sub?.cancel_at_period_end || false,
        createdAt: profile.created_at,
        lastSignIn: authUser?.last_sign_in_at || null,
        locationCount,
      };
    });

    return res.status(200).json({
      summary: {
        totalUsers: userList.length,
        freeCount,
        trialCount,
        paidCount,
        signupsToday,
        signupsThisWeek,
      },
      users: userList,
    });
  } catch (error) {
    console.error('[admin/users] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
