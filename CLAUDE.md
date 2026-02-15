# Reel Recap

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.
- For non-trivial changes, include a step for updating relevant /docs/ files
  - Focus on "why" and gotchas, not step-by-step details
  - Update existing docs rather than creating new ones

## Tech Stack
- Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand
- Supabase (Auth + DB), Paddle.com (payments)
- External APIs: Supadata (transcripts), DeepSeek (summarization)

## Key Coding Rules
- Use `src/lib/supabase.ts` (client) and `src/lib/supabase-admin.ts` (server)
- Components: Functional, named exports, Tailwind + dark mode support
- API routes: Validate inputs, verify auth, check rate limits BEFORE external calls
- Use `getClientIP()` from `src/utils/ip.ts`
- TypeScript: Strict mode, define interfaces for props

## Database Tables
- `users` - User profiles
- `ip_usage` - Enforces quota (IP-based for auth users)
- `user_history` - Transcript history
- `usage_logs` - Audit log

## API Endpoints
- `/api/transcript` - Extract transcripts (1/day anon, 2/day auth by IP)
- `/api/summarize` - AI summaries (10/hour/IP rate limit)

## Critical Security Notes
- Quota consumed when API is called, NOT on success
- No refunds on failed API calls
- CAPTCHA tokens must be verified server-side
- Never commit `.env.local`

## File Locations
- Components: `src/components/`
- API routes: `src/app/api/`
- Config: `src/lib/constants.ts`
