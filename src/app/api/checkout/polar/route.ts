import { Checkout } from '@polar-sh/nextjs';

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
  server: (process.env.POLAR_SERVER as 'sandbox' | 'production') || 'production',
});
