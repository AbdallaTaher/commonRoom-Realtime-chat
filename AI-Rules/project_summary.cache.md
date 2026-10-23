# Autonomous Context Summary Cache
*Auto-generated per AGENTS.md Section 5*

## 1. Core Monorepo Architecture & Folder Conventions
As mandated by `00-project-idea.md` and the master rules:
- `./frontend/` -> UI and client-side application (React 18+, Vite, Tailwind CSS, Impeccable UI).
- `./backend/` -> API, server config, models, controllers (Node.js, Express, MongoDB/Mongoose).
- `./tests/` -> Root directory for E2E suites (Playwright/Cypress), shared integration tests, and static fixtures (`tests/fixtures/`).
- `./inputs/` -> User-supplied reference documents, external assets (e.g. `inputs/background.png`).
- `./ui-prototypes/` -> Visual HTML prototype files during Phase B (`ui-prototypes/<page>.html`).
- `./AI-Rules/` -> Authoritative architectural governance documents.

### Frontend Directory Structure (`frontend/src/`)
- `assets/`, `context/` (UI state only), `data/` (constants, user links), `features/[feature]/` (components, hooks, services), `hooks/` (global hooks), `pages/` (thin wrappers), `services/` (decoupled API), `styles/` (`index.css` design tokens), `ui/` (reusable Impeccable + Tailwind UI primitives), `utils/` (`cn` helper), `App.jsx`, `main.jsx`.

### Backend Directory Structure (`backend/`)
- `server.js` (entry, DB, error process listeners), `app.js` (Express app, middleware, route mounting, 404), `config.env` (environment variables), `models/` (Mongoose schemas, validations, hooks), `controllers/` (skinny controllers, authController, userController, errorController, handlerFactory), `routes/`, `utils/` (`appError.js`, `catchAsync.js`, `apiFeatures.js`, `email.js`), `public/`.

---

## 2. Technology Stack & Key Standards

### Frontend Stack (Option A - React SPA):
- **Core:** React 18+, Vite
- **Routing:** `react-router-dom` (v6+) with loaders/nested routes
- **Server State:** `@tanstack/react-query` (NEVER `useEffect` or `useState` for data fetching)
- **UI State:** React Context API (only for global UI state like Dark Mode)
- **Forms:** `react-hook-form` (uncontrolled via `register`)
- **Styling:** Tailwind CSS + Semantic CSS variables in `index.css`
- **UI Library:** Impeccable UI style primitives with Tailwind
- **Icons:** `react-icons/hi2` (Heroicons 2)
- **Notifications:** `react-hot-toast`
- **Charts:** `recharts`
- **Dates:** `date-fns`
- **Animations:** `gsap` & `@gsap/react` via `useGSAP()`

### Backend Stack (Option A - Express & MongoDB MVC):
- **Runtime & Framework:** Node.js, Express.js
- **Database & ODM:** MongoDB, Mongoose
- **Patterns:** MVC, Fat Models & Skinny Controllers, `handlerFactory.js`, `catchAsync.js`, `APIFeatures`, centralized `errorController.js`
- **Auth:** `bcryptjs`, JWT stored exclusively in `HttpOnly`, `Secure`, `SameSite` cookies
- **Middleware:** `helmet`, `cors`, `morgan`, `compression`, `express.json({ limit: '10kb' })`
- **Database Gateway:** MongoDB Atlas Free Tier (M0) Zero-Knowledge setup protocol before writing models or connection strings

---

## 3. Strict Operating Directives & Forbidden Practices
1. **Zero Hallucination / Shortcuts:** No `// ...existing code...` or incomplete placeholders. Always output full, working files.
2. **Phase Isolation:**
   - **Phase A (Architecture & Planning):** ZERO application code. Output plan and Construction Tree -> Wait for user approval.
   - **Phase B (Visual HTML Prototype):** ZERO production React or backend code. Build standalone HTML prototypes in `ui-prototypes/` using Tailwind CDN, Lucide CDN, Impeccable style, GSAP -> Live Preview -> Wait for explicit user confirmation: `"UI Approved"` or `"التصميم معتمد"`.
   - **Phase C (Task Breakdown):** ZERO application code. Deconstruct approved plan into an atomic markdown task list (Vertical Slicing for Full-Stack) -> Wait for user approval -> Generate `TASKS LIST.md`.
   - **Phase D (Task Implementation):** Exactly ONE task at a time. Write code -> AI test -> Stop for manual user test gate (Postman / Browser) -> Security Check -> Update `TASKS LIST.md` with `[x]` -> Ask permission before next task.
3. **No Direct Fetching:** UI components must never use `fetch` or `axios` directly; consume React Query hooks which call `src/services/`.
4. **No Raw Try/Catch in Controllers:** Always wrap async controller functions with `catchAsync`.
5. **No Token in LocalStorage:** Never store JWTs or sensitive session tokens in `localStorage` or `sessionStorage`.
6. **No Wildcard CORS:** Restrict CORS origin in production.
7. **Animation Performance:** Only animate `transform` and `opacity`. Prevent layout thrashing and keep DOM depth < 32 and nodes < 800 per view.
8. **Beginner Protocol:** Assume user is an absolute beginner. Provide click-by-click, beginner-friendly instructions for third-party tools, Postman, MongoDB Atlas, Git, and deployment.

---

## 4. Execution Workflow Lifecycle
- **Phase A:** Planning, Architecture & Construction Tree Approval.
- **Phase B:** UI Prototyping (`ui-prototypes/*.html`) & Design Approval Gate.
- **Phase C:** Task Breakdown & Generation of `TASKS LIST.md`.
- **Phase D:** Strict Single-Task Implementation Loop with User Gate & Security Check.
- **Phase E:** Version Control & GitHub Integration (click-by-click guide).
- **Phase F:** Production & Deployment (Lighthouse 90+ across all 4 pillars, Vercel/Render/Railway setup).
