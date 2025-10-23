import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/';

  console.log('🔄 Auth callback hit!');
  console.log('Full callback URL:', request.url);
  console.log('Request URL object:', {
    href: requestUrl.href,
    origin: requestUrl.origin,
    pathname: requestUrl.pathname,
    search: requestUrl.search,
    hash: requestUrl.hash
  });
  console.log('Search params:', searchParams.toString());
  console.log('All search params:');
  for (const [key, value] of searchParams.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  console.log('Origin:', origin);
  console.log('Code:', code);
  console.log('Error:', error);
  console.log('Error Description:', errorDescription);
  console.log('Next:', next);
  
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("check origin =", origin, " next=", next, " error=", error);

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}