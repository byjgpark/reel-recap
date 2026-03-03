import { Webhooks } from '@polar-sh/nextjs';
import { supabaseAdmin } from '@/lib/supabase-admin';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function upsertSubscription(subscription: any) {
  const externalId = subscription.customer?.externalId;
  if (!externalId) {
    console.error('[Polar Webhook] No externalId on customer -- cannot link to Supabase user');
    return;
  }

  const data = {
    user_id: externalId,
    polar_customer_id: subscription.customerId || subscription.customer?.id,
    polar_subscription_id: subscription.id,
    polar_product_id: subscription.productId,
    status: subscription.status,
    current_period_start: subscription.currentPeriodStart || null,
    current_period_end: subscription.currentPeriodEnd || null,
    trial_start: subscription.trialStart || null,
    trial_end: subscription.trialEnd || null,
    cancel_at_period_end: subscription.cancelAtPeriodEnd || false,
    canceled_at: subscription.canceledAt || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(data, { onConflict: 'polar_subscription_id' });

  if (error) {
    console.error('[Polar Webhook] Error upserting subscription:', error);
    throw error; // Return 500 so Polar retries
  }

  console.log(`[Polar Webhook] Subscription ${subscription.id} upserted: ${subscription.status}`);
}

async function handleSubscriptionRevoked(subscription: any) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('polar_subscription_id', subscription.id);

  if (error) {
    console.error('[Polar Webhook] Error revoking subscription:', error);
    throw error;
  }

  console.log(`[Polar Webhook] Subscription ${subscription.id} revoked`);
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    console.log(`[Polar Webhook] Event: ${payload.type}`);
  },
  onSubscriptionCreated: async (payload) => {
    await upsertSubscription(payload.data);
  },
  onSubscriptionUpdated: async (payload) => {
    await upsertSubscription(payload.data);
  },
  onSubscriptionRevoked: async (payload) => {
    await handleSubscriptionRevoked(payload.data);
  },
  onOrderCreated: async (payload) => {
    console.log('[Polar Webhook] Order created:', payload.data.id);
  },
});
