import { supabaseAdmin } from './supabase-admin';
import { AUTHENTICATED_DAILY_LIMIT, PRO_DAILY_LIMIT, TRIAL_DAILY_LIMIT } from './constants';

export interface SubscriptionInfo {
  isPro: boolean;
  isTrial: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Check if a user has an active Pro subscription (active or trialing).
 * Fails closed: returns false on error to prevent free users from getting Pro access.
 */
export async function isProUser(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc('is_pro_user', {
      p_user_id: userId,
    });
    if (error) {
      console.error('Error checking pro status:', error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error('Error checking pro status:', error);
    return false;
  }
}

/**
 * Get detailed subscription info for a user.
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionInfo> {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return {
        isPro: false,
        isTrial: false,
        status: null,
        currentPeriodEnd: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const now = new Date();
    const isExpired =
      data.current_period_end && new Date(data.current_period_end) < now;
    const isTrialExpired =
      data.status === 'trialing' && data.trial_end && new Date(data.trial_end) < now;

    if (isExpired || isTrialExpired) {
      return {
        isPro: false,
        isTrial: false,
        status: 'expired',
        currentPeriodEnd: data.current_period_end,
        trialEnd: data.trial_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
      };
    }

    return {
      isPro: true,
      isTrial: data.status === 'trialing',
      status: data.status,
      currentPeriodEnd: data.current_period_end,
      trialEnd: data.trial_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return {
      isPro: false,
      isTrial: false,
      status: null,
      currentPeriodEnd: null,
      trialEnd: null,
      cancelAtPeriodEnd: false,
    };
  }
}

/**
 * Get the appropriate daily limit for a user based on subscription status.
 */
export async function getDailyLimitForUser(userId: string): Promise<number> {
  const subscription = await getUserSubscription(userId);
  if (subscription.isTrial) {
    return TRIAL_DAILY_LIMIT;
  }
  if (subscription.isPro) {
    return PRO_DAILY_LIMIT;
  }
  return AUTHENTICATED_DAILY_LIMIT;
}
