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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Get the user's subscription record to find their Stripe customer ID
    const { data: subRow, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (subError || !subRow) {
      return res.status(404).json({ error: 'No subscription record found' });
    }

    // If we already have a subscription ID, check it directly
    if (subRow.stripe_subscription_id) {
      const subscription = await stripe.subscriptions.retrieve(subRow.stripe_subscription_id);
      const result = await syncSubscriptionToSupabase(userId, subscription);
      return res.status(200).json(result);
    }

    // Otherwise, look up subscriptions by customer ID
    if (subRow.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: subRow.stripe_customer_id,
        limit: 1,
        status: 'all',
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        const result = await syncSubscriptionToSupabase(userId, subscription);
        return res.status(200).json(result);
      }
    }

    // No Stripe subscription found
    return res.status(200).json({ status: 'free', tier: 'free' });
  } catch (error) {
    console.error('Error syncing subscription:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}

async function syncSubscriptionToSupabase(userId: string, subscription: Stripe.Subscription) {
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

  const { error } = await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      status,
      tier,
      trial_ends_at: trialEndsAt,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating subscription during sync:', error);
  }

  return { status, tier, trial_ends_at: trialEndsAt };
}
