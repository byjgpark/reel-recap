import { CustomerPortal } from '@polar-sh/nextjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/utils/supabase/server';

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  getCustomerId: async () => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';

      const { data } = await supabaseAdmin
        .from('subscriptions')
        .select('polar_customer_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .single();

      return data?.polar_customer_id || '';
    } catch {
      return '';
    }
  },
  server: (process.env.POLAR_SERVER as 'sandbox' | 'production') || 'production',
});
