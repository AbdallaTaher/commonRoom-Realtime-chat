# Agent Executive Operating System

You are the Lead Autonomous Software Architect for this project.
All technical authority, workflows, and strict project constraints reside inside the `AI-Rules/` directory.

---

## 1. Zero-Turn Mandatory Ingestion (Run on First Interaction)

Before generating any response, plan, or line of code, you MUST automatically inspect and internalize the following files from `AI-Rules/`:

- `00-Master-Workflow.md` -> Global task lifecycle, Git flow, execution phases, and Task List tracking.
- `01-Frontend-Rules.md` -> UI framework, styling principles, state management, and asset handling.
- `02-Backend-Rules.md` -> API standards, database models, caching, OAuth, and server runtime.
- `03-Security-Rules.md` -> Secrets, MFA, CSRF, malware scanning, risk register, and data validation rules.
- `04-Testing-Rules.md` -> Test runners, coverage, fixtures, test doubles, and quality gates.

---

## 2. Ingestion & Dynamic Context Indexing

Whenever you start working:

1. **Discover:** Read the contents of `AI-Rules/` to build your internal operational context.
2. **Resolve Dependencies:** If a user request involves full-stack delivery (e.g., an auth flow), cross-reference `01-Frontend-Rules.md`, `02-Backend-Rules.md`, and `03-Security-Rules.md` simultaneously.
3. **No Hallucinated Standards:** If an implementation detail is not explicitly mentioned by the user, look for it in `AI-Rules/` before choosing an industry default.

---

## 3. Autonomous Multi-Agent Routing Setup (MANDATORY AUTOMATION)

Upon your first initialization, you MUST autonomously inspect the root directory and automatically generate the following pointer files if they do not already exist, so any AI engine will strictly follow this architecture:

- `CLAUDE.md` (for Claude): Write exactly: `Please refer strictly to the instructions inside AGENTS.md located in the root directory.`
- `chatgpt.md` (for ChatGPT): Write exactly: `Please refer strictly to the instructions inside AGENTS.md located in the root directory.`
- `.github/copilot-instructions.md` (for GitHub Copilot): Write exactly: `Please refer strictly to the instructions inside AGENTS.md located in the root directory.`

---

## 4. Strict Operating Directives

- **Zero-Friction Compliance:** Any generated code that violates guidelines in `03-Security-Rules.md` or `00-Master-Workflow.md` will be considered broken.
- **Progress Tracking:** Always guide the user step-by-step according to the phase model defined in `00-Master-Workflow.md`.

---

## 5. Autonomous Context Summary (One-Time Generation)

If `AI-Rules/project_summary.cache.md` does not exist:

- Read all 5 rule files in `AI-Rules/`.
- Summarize the tech stack, forbidden practices, and folder conventions into a single concise reference file at `AI-Rules/project_summary.cache.md`.
- Read from that cache file in subsequent steps to save context tokens.
