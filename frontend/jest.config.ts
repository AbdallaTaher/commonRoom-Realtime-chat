import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  clearMocks: true,
  coverageProvider: "v8",
  collectCoverageFrom: [
    "lib/auth/validation.ts",
    "lib/conversations/validation.ts",
    "lib/groups/validation.ts",
    "lib/messages/validation.ts",
    "lib/profiles/validation.ts",
    "lib/profiles/avatar-url.ts",
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
    "./lib/auth/validation.ts": { statements: 80, branches: 80, functions: 80, lines: 80 },
    "./lib/conversations/validation.ts": { statements: 80, branches: 80, functions: 80, lines: 80 },
    "./lib/groups/validation.ts": { statements: 80, branches: 80, functions: 80, lines: 80 },
    "./lib/messages/validation.ts": { statements: 80, branches: 80, functions: 80, lines: 80 },
    "./lib/profiles/validation.ts": { statements: 80, branches: 80, functions: 80, lines: 80 },
    "./lib/profiles/avatar-url.ts": { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^next/link$": "<rootDir>/__mocks__/next-link.tsx",
    "^next-themes$": "<rootDir>/__mocks__/next-themes.tsx",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/e2e/"],
};

export default createJestConfig(config);
