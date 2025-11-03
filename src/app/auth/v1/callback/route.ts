import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const next = searchParams.get('next') ?? '/';

  logger.debug('Auth callback request URL', requestUrl, 'AuthCallback');
  logger.debug('Auth callback searchParams', Object.fromEntries(searchParams.entries()), 'AuthCallback');
  logger.debug('Auth callback origin', origin, 'AuthCallback');

  // Essential logging for production monitoring
  logger.info('Auth callback processed', {
    hasCode: !!code,
    hasError: !!error,
    errorType: error || undefined,
  }, 'AuthCallback');
  
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      logger.info('Auth session exchange successful', undefined, 'AuthCallback');
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      logger.error('Auth session exchange failed', error, 'AuthCallback');
    }
  }

  // return the user to an error page with instructions
  logger.warn('Auth callback failed - redirecting to error page', undefined, 'AuthCallback');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}