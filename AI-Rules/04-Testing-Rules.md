# Project Testing Standards & Architectural Guidelines

This document governs the quality assurance standards and testing protocols. You must read `00-project-idea.md` to determine the scale and required testing tiers.

## 1. Universal Baseline (Mandatory for All Projects)

Every project—regardless of size or architecture—must implement these testing gates:
**Static Gates:** Compile validation, strict type checks (TypeScript), linting rules (ESLint), architectural import boundaries, and secret scanning to ensure no committed credentials/keys.
**Static Security Auditing:** Clean automated npm audit (and dependency vulnerability checks via tools like Snyk) on CI/CD pipelines.
**Unit Testing:** Isolate pure logic, validation rules, algorithmic utilities, custom hooks, calculations, and state transitions. Cover happy paths and edge conditions (Vitest/Jest). Enforce strict **Code Coverage targets (e.g., Minimum 80% coverage)** for core business logic.
**Test Doubles Isolation:** Strictly utilize **Test Doubles (Mocks, Stubs, Spies, Fakes)** during unit/integration tests to predictably isolate dependencies and intercept external API calls without hitting real servers.
**Fixtures Management:** Maintain organized **Fixtures** (known static data states and mock databases) in dedicated directories (e.g., `tests/fixtures/`) to ensure deterministic and repeatable test outcomes ("Known data, known result").
**Flaky Test Eradication:** Treat any **Flaky Test** (tests that pass/fail randomly without code changes) as an immediate critical bug. Flaky tests must never be bypassed or ignored; they must be debugged and stabilized immediately.
**Component Testing:** Isolate UI component units to ensure each component renders its visual states accurately and handles user interactions/events properly (React Testing Library / Playwright Component Testing / Cypress Component Testing).
**Integration Testing:** Test inter-module communication (e.g., Controller interacting with a Database layer), real process execution, and real datastore interactions over real transport layers while mocking third-party external network boundaries (Supertest / Testcontainers).
**Smoke Testing:** High-level deployment verification ensuring the build boots without runtime crashes and critical root endpoints return valid status codes.
**Cross-Browser & Responsiveness Validation:** Ensure dynamic layouts render correctly across standard breakpoints (Mobile, Tablet, Desktop) and modern browser rendering engines (Chromium, WebKit, Gecko).

## 2. High-Priority Recommended Suite (Medium-to-Large Applications)

Implement for SaaS products, and user-facing commercial platforms:
**End-to-End (E2E) Testing:** Complete end-user workflow simulation where a real client completes a real user journey from start to finish (Playwright or Cypress).
**Regression Testing:** Automated execution of existing test suites across every PR to guarantee new changes do not break legacy features.
**API Contract Verification:** Comprehensive verification of payloads, status codes (2xx, 4xx, 5xx), and schemas.
**Automated Performance & Core Web Vitals Auditing:** Enforce Lighthouse CI (LHCI) runs or automated page-speed benchmarks verifying:

- Largest Contentful Paint (LCP < 2.5s).
- Cumulative Layout Shift (CLS < 0.1).
- Interaction to Next Paint (INP < 200ms).
- First Contentful Paint (FCP < 1.8s).
- Assert strict non-regression: The build fails if the Lighthouse performance score falls below 90/100.
  **Authorization Testing:** Matrix-based security verification validating access control rules: every role x every protected action/endpoint, explicitly covering anonymous access, expired sessions, and revoked credentials.

## 3. Conditional Testing Matrix (Trigger-Based)

Activate these categories only when specific architectural triggers are met in the project idea:
**Load / Capacity Testing:** Trigger if high concurrent users are expected. Used for throughput and latency threshold validation under high concurrency and capacity planning (k6).
**Stress / Spike Testing:** Trigger for fixed high-concurrency dates (e.g., ticket drops, flash sales, high-traffic events).
**Contract Testing:** Trigger for Microservices or decoupled Frontend/Backend teams. Verify producer/consumer data shapes agree and generated API specs are kept fresh without breaking changes (Pact).
**Snapshot Testing / Visual Regression:** Trigger for Design Systems and shared UI Component libraries to detect unintended structural and styling changes against an approved baseline.
**Property-Based Testing:** Trigger for complex mathematical models, parsers, or mission-critical data pipelines. Employ fuzzing where the machine automatically invents a massive array of randomized inputs to find edge-case failures.
**Accessibility Testing (a11y):** Trigger for public sector or legal compliance (ADA/WCAG) to ensure zero accessibility barriers.
**User Acceptance (UAT):** Trigger for Enterprise deliverables and client-tailored contracts to validate delivery against business requirements.

## 4. Enterprise & Mission-Critical Operations

Reserved for high-reliability systems, fintech platforms, or large-scale distributed architectures:
**Resilience Testing:** Validate system stability under concurrency issues, race conditions, idempotency checks (preventing duplicate transactions on retry), partial service failures, and transaction time/cost budgets.
**Guardrails Testing:** Drift detection verifying silently dropped database migrations, regressed environment configurations, bundle size limits, and architectural performance budgets.
**Soak / Endurance Testing:** Runs a continuous moderate load over prolonged periods to identify memory leaks, connection pool exhaustion, and resource degradation over time.
**Mutation Testing:** Intentionally introduces faults (mutants) into production code to verify whether existing tests catch them, measuring true test suite quality (Stryker Mutator).
**Chaos Testing:** Intentionally shuts down database instances, terminates containers, or injects network latency to verify system recovery and self-healing (Chaos Mesh, Gremlin).
**Dynamic Security Testing (DAST):** Automated vulnerability scans targeting injection vectors (SQLi, XSS, CSRF) and broken authentication (OWASP ZAP).
