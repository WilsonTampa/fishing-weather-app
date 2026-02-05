import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, priceId, trialDays, successUrl, cancelUrl } = req.body;

    if (!userId || !priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
