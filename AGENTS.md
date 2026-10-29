# Agent instructions: cabinet-samet

Context for AI coding agents (Claude Code, Codex, etc.) working in this repository.

## Project
Client portal for an accounting firm. Next.js 14 App Router with API routes, Prisma on Supabase PostgreSQL, NextAuth. The mobile app (`cabinet-samet-app`) calls the same API routes.

## Commands
- `npm run dev`: start locally on port 3000
- `npx tsc --noEmit`: type-check (CI runs this)
- `npm run build`: production build (CI runs this)
- `npx prisma db push`: apply schema changes to the database

## Rules
- Every API route must authenticate first: `getAuthUser(request)` for client routes (supports cookie and mobile Bearer token), `getAdminSession()` for `/api/admin/*`. Never trust a user id from the request body.
- Clients may only read or change their own rows: always filter Prisma queries by the authenticated `user.id`.
- Secrets only in environment variables. When adding one, also add it to `.env.example`. Never log tokens, passwords or 2FA codes.
- User-facing text is in French. Keep error messages short and generic for auth failures.
- Any route used by the mobile app must keep its response shape, or the app must be updated in the same change.
- New tables need `ENABLE ROW LEVEL SECURITY` in `prisma/rls_lockdown.sql`.

## Before finishing
Run the type-check and the build, and describe what you changed and why.
