import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AnalyticsClient from './AnalyticsClient';

// Server Component - Checks auth before rendering
export default async function AnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Server-side auth check - happens BEFORE page loads
    if (!user || user.email !== 'byjpark21@gmail.com') {
        redirect('/');
    }

    // Only render if user is admin
    return <AnalyticsClient />;
}
