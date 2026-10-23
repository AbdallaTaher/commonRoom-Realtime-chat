<!-- Keep these instructions, so the AI can organize the project construction tree-->

Extended Monorepo & Testing Layout Mandate:
Enforce strict separation of concerns at the root level by isolating the project into three core directories:
1- ./frontend/ for all UI and client-side code (governed by 01-Frontend-Rules.md).
2- ./backend/ for all API endpoints, server configuration, and models (governed by 02-Backend-Rules.md).
3- ./tests/ as a dedicated root directory for comprehensive end-to-end (E2E) suites, shared integration tests, and static fixtures (governed by 04-Testing-Rules.md).
Reflect this three-tier architecture directly in Phase A when proposing the Construction Tree.

4-./AI-Rules/ for all rules and guidelines (governed by 00-project-idea.md).

<!-- Enter the project details here -->

<!-- Note:  The more details you add, the better the execution.
Answer these questions inside the file to clarify your project:
Who is the target audience? (Client, Employee, Manager?).
What are the user roles/permissions? (e.g., Normal User, Admin).
How should the system handle Edge Cases? (What if inputs are empty? What if the network fails or
an unauthorized user tries to access a page?).
Any other details to clarify the user journey: (What does the user do from login until they achieve
their goal?).
1. External Links: Add a section for your links to keep the code clean:
LinkedIn: https://linkedin.com/in/myaccount (For Footer).
Portfolio Project: https://weather-app.com (For Portfolio section).
1. External Files: If you have an external file (PDF / Word / ...): Place it inside the inputs/ folder (e.g.
inputs/my-cv.pdf or inputs/requirements.docx ). Then in 00-project-idea.md , specify its role:
Case 1 (Project Blueprint / Requirements): Write: "Full specifications and features are documented
in inputs/requirements.docx; adopt it as the core planning foundation" .
Case 2 (Data/Content source - e.g. Resume for portfolio): Write: "Reference file is at inputs/mycv.
pdf. Extract my personal information, experience, and skills into the data/ folder to serve as the
portfolio content." -->

Project idea: I want to Build a production-ready, full-stack real-time chat web application from scratch
Project Goal: To create a fully functional real time chat app eigther for groups or private person to person

Project Scope: Full-Stack Web Application

 <!--e.g. Full stack / Front end only / back end only -->

Tech stack:Frontend: Next.js (App Router, TypeScript) + Tailwind CSS + shadcn/ui

Backend & Database: Supabase (PostgreSQL, Supabase Auth, Row Level Security)

Real-Time Engine: Supabase Realtime (WebSockets for live messaging and presence/status)

 <!--e.g. next.js, -->
