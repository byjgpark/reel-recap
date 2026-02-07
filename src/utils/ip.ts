import { NextRequest } from 'next/server';

/**
 * Extract the client IP address from a Next.js request.
 *
 * On Vercel, x-forwarded-for is set by the platform and the first
 * IP in the chain is the client IP. This cannot be spoofed on Vercel.
 */
export function getClientIP(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const firstIP = xff.split(',')[0]?.trim();
    if (firstIP && firstIP !== 'unknown') {
      return firstIP;
    }
  }

  return request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         'unknown';
}
