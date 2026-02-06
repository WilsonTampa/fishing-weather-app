import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  handleCors,
  verifyAuth,
  isValidUUID,
  checkRateLimit,
  getClientIp,
} from './lib/middleware.js';

// Validate required env vars at startup
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check env vars inside the handler so we get a clear error in logs
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [];
    if (!STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
    if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
    if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    console.error('Missing env vars:', missing.join(', '));
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Rate limiting: 20 sync requests per IP per 5 minutes (higher limit for polling)
  const ip = getClientIp(req);
  if (!checkRateLimit(`sync:${ip}`, 20, 5 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Authenticate the user
  const authenticatedUserId = await verifyAuth(req, res);
  if (!authenticatedUserId) return;

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { userId } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    if (!isValidUUID(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    console.log(`[sync] Starting sync for user ${userId}`);

    // Get the user's subscription record to find their Stripe customer ID
    const { data: subRow, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    console.log('[sync] Supabase subscription row:', JSON.stringify(subRow), 'error:', subError?.message);

    // Strategy 1: If we already have a subscription ID, check it directly
    if (subRow?.stripe_subscription_id) {
      console.log('[sync] Strategy 1: retrieving subscription', subRow.stripe_subscription_id);
      const subscription = await stripe.subscriptions.retrieve(subRow.stripe_subscription_id);
      const result = await syncSubscriptionToSupabase(supabase, userId, subscription);
      console.log('[sync] Strategy 1 result:', JSON.stringify(result));
      return res.status(200).json(result);
    }

    // Strategy 2: Look up subscriptions by customer ID
    if (subRow?.stripe_customer_id) {
      console.log('[sync] Strategy 2: listing subscriptions for customer', subRow.stripe_customer_id);
      const subscriptions = await stripe.subscriptions.list({
        customer: subRow.stripe_customer_id,
        limit: 1,
        status: 'all',
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        console.log('[sync] Found subscription:', subscription.id, 'status:', subscription.status);
        const result = await syncSubscriptionToSupabase(supabase, userId, subscription);
        console.log('[sync] Strategy 2 result:', JSON.stringify(result));
        return res.status(200).json(result);
      }
      console.log('[sync] Strategy 2: no subscriptions found for customer');
    }

    // Strategy 3: Look up the Stripe customer by the user's email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    console.log('[sync] Strategy 3: looking up customer by email', profile?.email);

    if (profile?.email) {
      const customers = await stripe.customers.list({
        email: profile.email,
        limit: 5,
      });

      console.log('[sync] Found', customers.data.length, 'Stripe customers for email');

      for (const customer of customers.data) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 1,
          status: 'all',
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          console.log('[sync] Found subscription via email:', subscription.id, 'status:', subscription.status);

          // Backfill the customer ID
          await supabase
            .from('subscriptions')
            .upsert(
              { user_id: userId, stripe_customer_id: customer.id, status: 'free', tier: 'free' },
              { onConflict: 'user_id' }
            );

          const result = await syncSubscriptionToSupabase(supabase, userId, subscription);
          console.log('[sync] Strategy 3 result:', JSON.stringify(result));
          return res.status(200).json(result);
        }
      }
    }

    // No Stripe subscription found at all
    console.log('[sync] No Stripe subscription found for user');
    return res.status(200).json({ status: 'free', tier: 'free' });
  } catch (error) {
    console.error('[sync] Error:', error);
    return res.status(500).json({ error: 'Failed to sync subscription' });
  }
}

async function syncSubscriptionToSupabase(
  supabase: any,
  userId: string,
  subscription: Stripe.Subscription
) {
  let status: string;
  let tier: string;
  let trialEndsAt: string | null = null;

  if (subscription.status === 'trialing') {
    status = 'trial';
    tier = 'trial';
    if (subscription.trial_end) {
      trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
    }
  } else if (subscription.status === 'active') {
    status = 'active';
    tier = 'paid';
  } else if (subscription.status === 'past_due') {
    status = 'past_due';
    tier = 'paid';
  } else {
    status = subscription.status;
    tier = 'free';
  }

  const upsertData = {
    user_id: userId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    status,
    tier,
    trial_ends_at: trialEndsAt,
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  console.log('[sync] Upserting subscription data:', JSON.stringify(upsertData));

  const { error, data } = await supabase
    .from('subscriptions')
    .upsert(upsertData, { onConflict: 'user_id' })
    .select();

  if (error) {
    console.error('[sync] Upsert error:', JSON.stringify(error));
  } else {
    console.log('[sync] Upsert success, returned:', JSON.stringify(data));
  }

  return { status, tier, trial_ends_at: trialEndsAt };
}
