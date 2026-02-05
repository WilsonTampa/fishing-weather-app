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

// Disable body parsing, we need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false
  }
};

// Helper to read raw body
async function buffer(readable: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return res.status(400).json({ error: `Webhook Error: ${message}` });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;

        if (!userId) {
          console.error('No supabase_user_id in subscription metadata');
          break;
        }

        // Determine tier based on subscription status and trial
        let status: string;
        let tier: string;
        let trialEndsAt: string | null = null;

        if (subscription.status === 'trialing') {
          // Active trial period (from Stripe Checkout with trial_period_days)
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
          tier = 'paid'; // Grace period
        } else {
          status = subscription.status;
          tier = 'free';
        }

        const { error, count } = await supabase
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
          .eq('user_id', userId)
          .select('id');

        if (error) {
          console.error('Error updating subscription:', error);
        } else if (!count) {
          // No row matched — the subscription row may not exist yet.
          // Insert one so the user's trial/paid status is captured.
          console.warn(`No subscription row found for user ${userId}, inserting new row`);
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              status,
              tier,
              trial_ends_at: trialEndsAt,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            });
          if (insertError) {
            console.error('Error inserting subscription row:', insertError);
          } else {
            console.log(`Subscription inserted for user ${userId}: status=${status}, tier=${tier}`);
          }
        } else {
          console.log(`Subscription updated for user ${userId}: status=${status}, tier=${tier}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Subscription fully canceled — revert to free tier
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;

        if (!userId) {
          console.error('No supabase_user_id in subscription metadata');
          break;
        }

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'free',
            tier: 'free',
            stripe_subscription_id: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Error reverting subscription to free:', error);
        } else {
          console.log(`Subscription canceled for user ${userId}, reverted to free tier`);
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        // Fires 3 days before trial ends — Stripe handles reminder emails if enabled
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;
        console.log(`Trial ending soon for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const userId = subscription.metadata.supabase_user_id;

        if (!userId) {
          console.error('No supabase_user_id in subscription metadata');
          break;
        }

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating subscription to past_due:', error);
        } else {
          console.log(`Payment failed for user ${userId}, status set to past_due`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  return res.status(200).json({ received: true });
}
