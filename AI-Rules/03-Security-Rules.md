# Master Web Architecture & Security Workflow

Execute this workflow securely. Enforce mandatory baseline rules on EVERY project, then apply contextual modules based on the evaluation of 00-project-idea.md.

## Stage 1: Mandatory Core Baseline (Always Enforced)

Apply these baseline controls across all code, regardless of application scale:

### 1. Input Handling & Data Protection

Enforce strict server-side validation and sanitization on all incoming payloads using schema validators. Never trust client-side validation alone.
Protect against injection vectors (SQLi, NoSQLi, XSS, Command Injection).
Sanitize HTML outputs in frontend views using sanitizers like DOMPurify.

### 2. Cryptography & Secret Hygiene

Never commit credentials, secrets, or API keys to version control.
Enforce isolated environment configurations (`.env`) per deployment stage.
Hash all passwords using modern, adaptive algorithms (e.g., Argon2, bcrypt).
Enforce secure communications over HTTPS only and enable HSTS headers.

### 3. Session & Token Hardening

Store access/session tokens exclusively in secure cookies (`HttpOnly`, `Secure`, `SameSite`).
Avoid storing sensitive JWTs or session identifiers in `localStorage` or `sessionStorage`.
Enforce token expiration with short lifespans and implement revocable refresh tokens.
**CRITICAL:** Enforce strict **Session Fixation Prevention** by rotating/regenerating the Session ID or Token immediately upon login. Always implement explicit **CSRF Tokens** (Double Submit Cookie or synchronized tokens) to protect state-changing requests.

### 4. Server & Transport Hardening

Inject standard security headers using middleware (e.g., Helmet): `CSP`, `X-Frame-Options`.
Configure restrictive CORS origins; never allow wildcard origins (`*`) in production.
Sanitize error responses: log detailed stack traces internally, but return generic error messages to the client.

## Stage 2: Interactive Project Discovery

Before designing extended architecture, analyze `00-project-idea.md` to answer these 6 discovery questions:

1. **User Access:** Does the application have multiple roles or tiers (e.g., Admin, User)?
2. **File Storage:** Does the system accept file or media uploads from users?
3. **Traffic & Exposure:** Is the platform exposed to public internet traffic with expected high volume?
4. **Transactions & Integrity:** Does the system handle financial transactions or inventory?
5. **External Integrations:** Does the system consume critical third-party APIs?
6. **Compliance & Audit:** Is there a regulatory need to track sensitive actions?

## Stage 3: Dynamic Rule Module Routing (The 7 Modules)

Map the discovery responses directly to the following modular implementations. If triggered, you MUST apply their rules to the tasks:

**Module 01: Granular Access Control (If Q1=YES):** Enforce Role-Based Access Control (RBAC). Prevent Broken Object-Level Authorization (IDOR). Apply a default-deny policy across all routes. Require **MFA / 2FA (Multi-Factor Authentication)** for highly sensitive or admin tiers.
**Module 02: Secure File Processing (If Q2=YES):** Validate file types via magic bytes/MIME inspection AND enforce active **Malware/Antivirus Scanning** on all uploaded assets. Enforce strict file size boundaries. Never store uploaded user files directly on the application server (Use S3, Cloudinary, or Supabase Storage). Re-encode file names.
**Module 03: Scalability & Abuse Prevention (If Q3=YES):** Enforce Rate Limiting and throttling at the API level. Implement connection pooling. Offload heavy computations to Background Jobs/Message Queues.
**Module 04: Transactional Consistency (If Q4=YES):** Require an Idempotency-Key on critical mutations to prevent double-charging. Wrap all multi-step state mutations inside database ACID transactions (or use Saga Pattern).
**Module 05: Resilient Integrations (If Q5=YES):** Wrap outbound calls to external dependencies with a Circuit Breaker. Implement retry strategies utilizing exponential backoff. Enforce explicit connection timeouts.
**Module 06: Comprehensive Auditing (If Q6=YES):** Record immutable audit trails for high-risk operations (authentication, role changes, financial data). Filter and mask sensitive data in logs.
**Module 07: Risk Register (Universal Mandate):** Proactively maintain a documented Risk Register calculating severity (`Likelihood × Impact`) for vulnerabilities and operational risks, ensuring every identified threat has an assigned mitigation action mapped back to these modules.
