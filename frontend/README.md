# Commonroom frontend

For the project overview, setup, GitHub checklist, and Vercel deployment instructions, see the [repository README](../README.md).

The Commonroom web application uses Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui primitives, and Supabase Auth/Database/Realtime.

## Local setup

1. Install a supported Node.js version (20.9 or newer).
2. Create a Supabase project and copy its Project URL and publishable key from the dashboard.
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Install dependencies with `npm install`.
5. Start the app with `npm run dev` and open `http://localhost:3000`.

Never put a Supabase service-role key in a `NEXT_PUBLIC_` variable or commit `.env.local`. The publishable key is intended for browser use; database access must still be protected by Row Level Security policies.

## Project structure

- `app/` — App Router layouts and route entry points.
- `components/` — Shared app components and shadcn/ui primitives.
- `data/` — Static application content and centralized links.
- `features/` — Domain-specific UI and services for auth, conversations, messages, and presence.
- `lib/supabase/` — Browser/server Supabase clients and session refresh.
- `public/chat-background.png` — User-provided app and chat wallpaper.

Light and dark themes use semantic CSS tokens in `app/globals.css`. The selected theme persists in browser storage.

## Portfolio demo

Visitors can open `/demo` from the home page without creating an account. It uses fictional conversations and keeps new messages in page memory only; messages are not saved, shared, or sent to Supabase. Refreshing the page restores the sample conversation state. The demo provides a link to real account sign-up when a visitor wants to use the live service.

## Browser checks

Playwright covers the public sign-in/sign-up experience, protected-route redirect, theme switching, and a narrow mobile viewport in Chromium, Firefox, and WebKit. Install browsers once with `npx playwright install chromium firefox webkit`, then run `npm run e2e`.

Supabase-backed browser flows are opt-in and require a **dedicated non-production Supabase test project**. Set `E2E_ENABLE_SUPABASE=1`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` for the confirmed-account sign-in smoke test. To exercise direct chat, group creation, and message sending, also set `E2E_ALLOW_MUTATIONS=1` and `E2E_PEER_DISPLAY_NAME`; this creates a group and sends uniquely named test messages. To exercise actual registration, set `E2E_SIGNUP_DISPLAY_NAME`, `E2E_SIGNUP_EMAIL`, and `E2E_SIGNUP_PASSWORD` to a disposable address. These mutating tests leave their records in the test project, so do not point them at production. Never add credentials to source control. Static browser checks run without Supabase credentials.

For GitHub Actions, add the same test values as repository Actions secrets, plus `E2E_SUPABASE_URL` and `E2E_SUPABASE_PUBLISHABLE_KEY`. Leave `E2E_ENABLE_SUPABASE` and `E2E_ALLOW_MUTATIONS` unset to run only the credential-free browser checks.
