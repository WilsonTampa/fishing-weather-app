import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, getUserEmail } from './lib/email.js';
import {
  welcomeTrialEmail,
  trialEndingSoonEmail,
  subscriptionActivatedEmail,
  paymentFailedEmail,
  subscriptionCanceledEmail,
} from './lib/email-templates.js';

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

  // Validate env vars
  if (!process.env.STRIPE_SECRET_KEY || !process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing required env vars for webhook');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover'
  });

  // Cast to `any` to avoid strict type inference issues with ungenerated Supabase types
  const supabase: any = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

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
      process.env.STRIPE_WEBHOOK_SECRET
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

        const currentPeriodEnd = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : null;

        const { error, count } = await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            status,
            tier,
            trial_ends_at: trialEndsAt,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: subscription.cancel_at_period_end ?? false,
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
              current_period_end: currentPeriodEnd,
              cancel_at_period_end: subscription.cancel_at_period_end ?? false,
            });
          if (insertError) {
            console.error('Error inserting subscription row:', insertError);
          } else {
            console.log(`Subscription inserted for user ${userId}: status=${status}, tier=${tier}`);
          }
        } else {
          console.log(`Subscription updated for user ${userId}: status=${status}, tier=${tier}`);
        }

        // Send lifecycle emails
        const email = await getUserEmail(supabase, userId);
        if (email) {
          if (subscription.status === 'trialing' && event.type === 'customer.subscription.created') {
            // Welcome email for new trial
            const trialEnd = subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })
              : 'soon';
            sendEmail({
              to: email,
              subject: 'Welcome to My Marine Forecast - Your trial has started!',
              html: welcomeTrialEmail(trialEnd),
            });
          } else if (subscription.status === 'active' && event.type === 'customer.subscription.updated') {
            // Subscription activated (trial converted or direct purchase)
            // Only send when status actually changed to active (avoid duplicates)
            const previousAttributes = (event.data as any).previous_attributes;
            if (previousAttributes?.status && previousAttributes.status !== 'active') {
              sendEmail({
                to: email,
                subject: 'Your My Marine Forecast subscription is active',
                html: subscriptionActivatedEmail(),
              });
            }
          }
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

        // Send cancellation email
        const cancelEmail = await getUserEmail(supabase, userId);
        if (cancelEmail) {
          sendEmail({
            to: cancelEmail,
            subject: 'Your My Marine Forecast subscription has been canceled',
            html: subscriptionCanceledEmail(),
          });
        }

        break;
      }

      case 'customer.subscription.trial_will_end': {
        // Fires 3 days before trial ends
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;
        console.log(`Trial ending soon for user ${userId}`);

        if (userId) {
          const trialEmail = await getUserEmail(supabase, userId);
          if (trialEmail) {
            const daysLeft = subscription.trial_end
              ? Math.max(0, Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
              : 3;
            sendEmail({
              to: trialEmail,
              subject: `Your My Marine Forecast trial ends in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`,
              html: trialEndingSoonEmail(daysLeft),
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubscription = (invoice as any).subscription;
        if (!invoiceSubscription) break;

        const subscription = await stripe.subscriptions.retrieve(invoiceSubscription as string);
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

        // Send payment failed email
        const failedEmail = await getUserEmail(supabase, userId);
        if (failedEmail) {
          sendEmail({
            to: failedEmail,
            subject: 'Action needed: Payment failed for My Marine Forecast',
            html: paymentFailedEmail(),
          });
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
