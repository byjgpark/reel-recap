# Monetization & Pricing Strategy

## background
I paid 69,000 KRW for 30,000 requests. Also, I have average 77 DAU. Users are using average 400 requests per day.  

## Overview
Reel Recap operates on a freemium model with three distinct tiers designed to cater to casual users, regular users, and power users.

## 1. Anonymous User (Unregistered)
- **Cost**: Free
- **Daily Limit**: 1 request / 24 hours
- **Features**:
  - Single video summary
  - No history retention
  - No bulk extraction
- **Restrictions**: 
  - Rate limited by IP address
  - Captcha verification required

## 2. Registered Free User
- **Cost**: $0 / month
- **Daily Limit**: 2 requests / 24 hours
- **Features**:
  - Single video summary
  - **History**: View last 3 history items
  - Account persistence
- **Restrictions**:
  - No bulk extraction
  - Rate limited by User ID (and IP fallback)

## 3. Pro Plan
- **Cost**: $9.99 / month (polar.sh)
- **Daily Limit**: 50 requests / 24 hours
- **Features**:
  - **Bulk Extraction**: Process multiple videos at once
  - **Unlimited History**: Access full usage history
  - Priority support
  - Ad-free experience (future)
- **Technical Implementation**:
  - `PRO_DAILY_LIMIT` constant in `src/lib/constants.ts`
  - Validated via `isPro` flag in user profile/metadata

## 4. Pro Plan Trial
- **Trial Duration**: 7 days
- **Trial Daily Limit**: 15 requests / 24 hours
- **Cost**: Free (no charge during trial)
- **Features During Trial**: Full Pro access (bulk extraction, unlimited history, priority support)
- **Payment Required**: Credit card collected upfront
- **Charge Timeline**: No charge until trial ends, then $9.99/month
- **Rationale**:
  - Gives users sufficient time to evaluate Pro features
  - 15 req/day for 7 days = ~241 KRW cost per trial user
  - Sustainable cost even with high trial signup volume
  - Reduces refund requests by pre-vetting users

## Implementation Details
- **Limits**: Defined in `src/lib/constants.ts`
- **Enforcement**: 
  - Frontend: `src/lib/usageTracking.ts`
  - Backend: Supabase RPCs (`process_authenticated_request`)
  - Middleware: IP-based rate limiting