# Commonroom

Commonroom is a real-time chat app built as a portfolio project. It includes private one-to-one conversations, groups, member profiles, live presence, read receipts, and a public interactive demo that visitors can try without creating an account.

The `/demo` experience uses fictional sample conversations and keeps messages in browser memory. Demo activity is not sent to Supabase and resets when the page is refreshed or left.

## Features

- Email and password sign-up, sign-in, password reset, and protected workspace routes.
- Direct conversations and group chats with member and owner permissions.
- Live messages and presence using Supabase Realtime.
- Unread counts, read receipts, profile bios, and avatar uploads.
- Responsive inbox with light and dark themes.
- Public portfolio demo with sample data and no account requirement.
- Database access protected by Supabase Row Level Security (RLS).

## Technology

- Next.js App Router and React 19
- TypeScript
- Tailwind CSS and Radix UI primitives
- Supabase Auth, PostgreSQL, Storage, and Realtime
- Jest and React Testing Library
- Playwright across Chromium, Firefox, and WebKit
- GitHub Actions for lint, type, unit, dependency, secret-scan, build, and browser checks
- Vercel for hosting

## Project structure

```text
.
├── .github/workflows/       # GitHub Actions quality gates
├── frontend/                # Next.js application
│   ├── app/                 # Pages, layouts, route handlers
│   ├── components/          # Shared and feature UI
│   ├── e2e/                 # Playwright browser tests
│   ├── features/            # Feature-oriented application code
│   ├── lib/                 # Validation, actions, Supabase clients
│   └── public/              # Static assets, including the chat background
├── supabase/migrations/     # Ordered SQL migrations and access policies
├── tests/                   # Shared test fixtures and support
└── ui-prototypes/           # Approved design references
```

## Run locally

### Requirements

- Node.js 20.9 or newer (Node.js 22 LTS is also suitable).
- npm.
- A Supabase project for account-based features. The public `/demo` page does not require Supabase credentials.

### Setup

1. Open a terminal in the repository's `frontend/` folder.
2. Copy `frontend/.env.example` to `frontend/.env.local`.
3. In Supabase, open **Project Settings → API** and copy the Project URL and publishable key into `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Install locked dependencies and start the development server:

   ```bash
   npm ci
   npm run dev
   ```

5. Open `http://localhost:3000`. To try the account-free sample, select **Try the interactive demo** or open `http://localhost:3000/demo`.

For database setup, apply the SQL files in `supabase/migrations/` in timestamp order to your Supabase project. Do not expose a Supabase service-role key in the browser or commit it to GitHub. The publishable key is designed to be public; RLS policies must remain enabled for protected data.

## Checks

Run these from `frontend/`:

```bash
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

For browser tests, install the Playwright browsers once and run the suite:

```bash
npx playwright install chromium firefox webkit
npm run e2e
```

Most browser checks run without real accounts. Supabase-backed E2E flows are opt-in and must use a dedicated non-production test project. See [frontend/README.md](frontend/README.md) for the optional test environment variables. Never configure mutating E2E tests against production.

## Deploy on Vercel

The deployable Next.js app is in `frontend/`. When importing the GitHub repository into Vercel, set **Root Directory** to `frontend`; leave the framework preset as **Next.js** and use the detected install/build settings.

Add these variables in **Vercel → Project → Settings → Environment Variables**:

| Variable | Value | Environments |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | The public production origin, e.g. `https://your-domain.vercel.app` | Production |

Use your own Supabase project values. Do not add `SUPABASE_SERVICE_ROLE_KEY`; this application uses the publishable key and user sessions with RLS. The `NEXT_PUBLIC_` prefix means a value can be included in browser code, so only the publishable key belongs there. After adding or changing Vercel variables, create a new deployment for the new values to take effect.

In Supabase, open **Authentication → URL Configuration** after the Vercel URL is known:

1. Set **Site URL** to the production URL.
2. Add `https://YOUR-PRODUCTION-DOMAIN/**` to **Redirect URLs**. The app uses `/auth/callback` for email confirmation and password reset.
3. For Vercel preview deployments, optionally allow the preview domain pattern recommended in the Supabase URL Configuration guide. Keep the exact production URL configured for production use.
4. If you later add a custom domain, update `NEXT_PUBLIC_SITE_URL`, the Supabase Site URL, and the allowed redirect URLs, then redeploy.

Email sign-up and password reset should be tested from the deployed production URL before sharing the project. Google sign-in is intentionally not configured.

## GitHub and deployment checklist

- Keep `.env.local`, all `.env` files except `.env.example`, dependency folders, build output, test reports, and Vercel local state out of Git. The root `.gitignore` covers these paths.
- Use a GitHub repository rooted at this project directory so the repository includes `frontend/`, `supabase/`, `.github/`, and project documentation.
- The repository currently has Git metadata in `frontend/.git`. Before the first root-level GitHub push, preserve that history by moving the `.git` directory from `frontend/` to this repository root. Do not create a second repository inside `frontend/`.
- GitHub Actions runs the quality workflow in `.github/workflows/quality.yml`. Credential-free checks run without secrets; the Supabase mutation E2E tests stay disabled unless dedicated test-project Actions secrets are deliberately configured.
- In Vercel, import the GitHub repository and choose `frontend` as the Root Directory. Pushes to the production branch will then trigger deployments.
- Review the license choice before making the repository public. No license has been added because the project owner should choose the reuse terms.

## Security notes

- Never commit `.env.local`, passwords, private keys, Supabase service-role keys, or production credentials.
- If a secret was ever committed, removing the file is not enough: rotate the credential and clean the exposed Git history before publishing.
- Keep Supabase RLS enabled and review database migrations before applying them to a production project.
- The portfolio demo is isolated from Supabase and uses fictional data.

## License

No license has been selected yet. Until one is added, others do not have an explicit grant to reuse this code.
