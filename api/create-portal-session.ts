import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  handleCors,
  verifyAuth,
  isValidUUID,
  isValidUrl,
  checkRateLimit,
  getClientIp,
} from './lib/middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
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

  // Rate limiting: 10 portal requests per IP per 15 minutes
  const ip = getClientIp(req);
  if (!checkRateLimit(`portal:${ip}`, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Authenticate the user
  const authenticatedUserId = await verifyAuth(req, res);
  if (!authenticatedUserId) return;

  try {
    const { userId, returnUrl } = req.body;

    // Input validation
    if (!userId || !returnUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!isValidUUID(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    if (!isValidUrl(returnUrl)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Get user's Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing information found' });
    }

    // Create Stripe Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
}
