1. [x] **Project foundation** — Set up the Next.js App Router and TypeScript app in `frontend/`, Supabase SSR clients, shared UI structure, design tokens, and light/dark theme persistence. Configure the Supabase Free project and local environment without committing secrets. Add linting, type checking, and test tooling.

2. [x] **Authentication** — Connect Supabase Auth for email/password sign-up, sign-in, and sign-out. Create profile provisioning and profile RLS policies. Protect authenticated routes and handle invalid input, expired sessions, duplicate accounts, and auth service failures. Add focused tests and browser checks.

3. [x] **Profiles and member discovery** — Build profile setup and editing, then add member search to start conversations. Validate profile fields and prevent unauthorized profile changes or unnecessary exposure of email addresses. Add tests and cover empty, invalid, and failed searches.

4. [x] **Direct conversations** — Add database migrations and RLS for conversations and membership, then build the inbox and direct-conversation creation flow. Ensure only members can view conversations and prevent duplicate direct conversations. Add tests for permissions, empty inboxes, and creation conflicts.

5. [x] **Group conversations** — Add group creation, owner/member permissions, membership changes, and group details UI. Enforce owner-only management and prevent unauthorized access or duplicate membership. Add authorization and edge-case tests.

6. [x] **Messaging and history** — Add the message schema, validation, membership-based RLS, paginated history, and the message composer. Handle blank or oversized messages, send failures, duplicate submissions, and empty conversations. Add tests for validation and access rules.

7. [x] **Live updates and presence** — Integrate Supabase Realtime for new messages and online presence, including reconnect behavior and subscription cleanup. Handle network loss, stale presence, and duplicate events. Add focused integration and browser checks.

8. [x] **Security and abuse controls** — Apply rate controls, secure session and CSRF handling for state-changing actions, sanitized error responses, and a project risk register. Review RLS across every table and add authorization checks for anonymous users, members, and group owners.

9. [x] **End-to-end and quality gates** — Add fixtures and Playwright coverage for sign-up/sign-in, direct and group messaging journeys, theme switching, protected-route behavior, and mobile layout across Chromium, Firefox, and WebKit. CI runs lint, type checks, unit coverage thresholds, dependency auditing, Gitleaks, production build, and browser checks. Supabase-mutating E2E scenarios are opt-in and require dedicated test-project credentials.

10. [x] **Portfolio demo sandbox** — Add a public `/demo` experience, linked from the home page, with clearly fictional fixture conversations and browser-local message state. Support switching conversations, search and filters, theme switching, mobile layout, and Enter/Shift+Enter message entry. Keep all demo activity isolated from Supabase and provide clear navigation back home or to real account sign-up. Add browser coverage and document the demo.
