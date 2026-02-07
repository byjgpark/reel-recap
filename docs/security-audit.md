# Security Audit Report — February 2025

## Incident
Supadata API usage spiked from ~80/day to 1,000. Investigation identified 3 critical vulnerabilities allowing unlimited API calls that bypass rate limits.

---

## Vulnerabilities Found & Fixed

### V1: CAPTCHA Bypass (CRITICAL) — FIXED
**File:** `src/app/api/transcript/route.ts`

**Issue:** `verifyCaptchaToken` was imported but never called. The code only checked if a `captchaToken` field was truthy (any non-empty string), then routed to `processCaptchaVerifiedRequest` — a SQL function with **no rate limit** that always returned `success: TRUE`.

**Attack:** `POST /api/transcript` with `{"url":"...", "captchaToken":"fake"}` bypassed all anonymous rate limits, allowing unlimited Supadata API calls.

**Fix:** Added server-side CAPTCHA verification via `verifyCaptchaToken(captchaToken, clientIP)` before processing captcha-verified requests.

---

### V2: Refund Loop Exploit (CRITICAL) — FIXED
**File:** `src/app/api/transcript/route.ts`

**Issue:** After the Supadata API was called (costs money), failed requests (no transcript, video too long, API errors) triggered `refundUsage()` which restored the user's quota. This created an infinite loop:
1. Submit URL -> quota consumed -> Supadata called -> request fails -> quota refunded
2. Repeat indefinitely with zero net quota cost

**Attack:** Submit URLs for videos with no transcripts or >3 minutes long. Each attempt consumed a Supadata API call but refunded the user's quota, allowing unlimited calls.

**Fix:** Removed all 4 `refundUsage()` calls. Quota now tracks API calls **attempted**, not successful deliveries. The `refundUsage` function is deprecated.

---

### V3: Summarize Endpoint — Zero Rate Limiting (HIGH) — FIXED
**File:** `src/app/api/summarize/route.ts`

**Issue:** The `/api/summarize` endpoint had no rate limiting, no authentication requirement, and no input validation beyond empty-string checks. Anyone could POST arbitrary text unlimited times, each call hitting the DeepSeek API (costs money).

**Fix:** Added in-memory per-IP rate limiting (10 requests/hour/IP). Moved user authentication check to before the DeepSeek API call.

---

## Additional Hardening Applied

### Centralized IP Extraction
**File:** `src/utils/ip.ts` (new)

Created a shared `getClientIP()` utility function used by both `/api/transcript` and `/api/summarize`. Ensures consistent IP extraction across all endpoints.

---

## Remaining Recommendations

### Per-User Limits for Authenticated Users
Currently, authenticated user limits are IP-based (`ip_usage` table). This means:
- Users on shared IPs (corporate networks, VPNs) share a single quota
- Changing IP gives a fresh quota

Consider adding per-user limits (via `user_usage` table) as a secondary check for authenticated users.

### CAPTCHA-Verified Request Limits
The `process_captcha_verified_request` SQL function has no upper bound — it always succeeds. Consider adding a daily cap (e.g., 5 captcha-verified requests per IP per day) in the SQL function.

### Serverless Rate Limiting Limitations
The in-memory rate limiter on `/api/summarize` resets on cold starts (Vercel serverless). For stronger guarantees, consider:
- Database-backed rate limiting (like the transcript endpoint uses)
- Vercel Edge Middleware with KV storage
- External rate limiting service

### Monitor API Usage
Set up alerts on Supadata and DeepSeek API dashboards for unusual usage spikes. Consider adding structured logging for all external API calls.
