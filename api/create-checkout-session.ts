import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  handleCors,
  verifyAuth,
  isValidUUID,
  isValidUrl,
  isValidPriceId,
  isValidTrialDays,
  checkRateLimit,
  getClientIp,
} from './lib/middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover'
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  if (handleCors(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting: 10 checkout requests per IP per 15 minutes
  const ip = getClientIp(req);
  if (!checkRateLimit(`checkout:${ip}`, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Authenticate the user
  const authenticatedUserId = await verifyAuth(req, res);
  if (!authenticatedUserId) return; // verifyAuth already sent the error response

  try {
    const { userId, priceId, trialDays, successUrl, cancelUrl } = req.body;

    // Input validation
    if (!userId || !priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!isValidUUID(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    if (!isValidPriceId(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    if (!isValidUrl(successUrl) || !isValidUrl(cancelUrl)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    if (trialDays !== undefined && !isValidTrialDays(trialDays)) {
      return res.status(400).json({ error: 'Invalid trial days value' });
    }

    // Get user's existing Stripe customer ID or create new customer
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subError);
      return res.status(500).json({ error: 'Failed to fetch subscription data' });
    }

    let customerId = subscription?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.email) {
        return res.status(400).json({ error: 'User profile not found' });
      }

      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { supabase_user_id: userId }
      });

      customerId = customer.id;

      // Save customer ID to subscription record (upsert in case the row doesn't exist yet)
      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert(
          { user_id: userId, stripe_customer_id: customerId, status: 'free', tier: 'free' },
          { onConflict: 'user_id' }
        );

      if (upsertError) {
        console.error('Error saving subscription with customer ID:', upsertError);
      }
    }

    // Create Stripe Checkout session (with optional trial period)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_collection: 'always',
      subscription_data: {
        metadata: { supabase_user_id: userId },
        ...(trialDays ? { trial_period_days: trialDays } : {})
      },
      allow_promotion_codes: true
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
