import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("sign-in page has accessible fields and password visibility control", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("button", { name: "Show password" })).toBeEnabled();

    await expect(page.getByRole("heading", { name: "Sign in to your space" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toHaveAttribute("type", "email");
    const password = page.getByLabel("Password", { exact: true });
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("sign-up form requires a name, email, password, and terms agreement", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    const form = page.locator("form").first();
    await expect(form.locator("#displayName")).toHaveAttribute("required", "");
    await expect(form.locator("#email")).toHaveAttribute("type", "email");
    await expect(form.locator("#password")).toHaveAttribute("minlength", "8");
    await expect(form.locator('input[name="terms"]')).toHaveAttribute("required", "");
    expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
  });

  test("protected workspace redirects a visitor to sign in", async ({ page }) => {
    await page.goto("/protected");
    await expect(page).toHaveURL(/\/auth\/login(?:\?.*)?$/);
    await expect(page.getByRole("heading", { name: "Sign in to your space" })).toBeVisible();
  });

  test("inbox theme switcher changes the selected theme", async ({ page }) => {
    await page.goto("/");
    const switcher = page.getByRole("button", { name: /theme|switch to (light|dark) mode/i });
    await expect(switcher).toBeEnabled();
    const before = await page.locator("html").getAttribute("class");
    await switcher.click();
    await expect.poll(() => page.locator("html").getAttribute("class")).not.toBe(before);
  });

  test("sign-in page fits a narrow mobile viewport without horizontal page overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/auth/login");

    await expect(page.getByRole("heading", { name: "Sign in to your space" })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  });
});

test.describe("Supabase authenticated smoke test", () => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  const enabled = process.env.E2E_ENABLE_SUPABASE === "1";

  test("a confirmed test member can sign in and reach the inbox", async ({ page }) => {
    test.skip(!enabled || !email || !password, "Set E2E_ENABLE_SUPABASE=1 and dedicated E2E_USER_EMAIL/E2E_USER_PASSWORD credentials to run against a test Supabase project.");

    await page.goto("/auth/login");
    await page.getByLabel("Email address").fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/protected(?:$|[?#])/);
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  });
});

test.describe("Supabase conversation journeys", () => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  const peerName = process.env.E2E_PEER_DISPLAY_NAME;
  const enabled = process.env.E2E_ENABLE_SUPABASE === "1" && process.env.E2E_ALLOW_MUTATIONS === "1";

  test("members can start a direct chat, create a group, and send in both", async ({ page }) => {
    test.skip(!enabled || !email || !password || !peerName, "Set up a dedicated Supabase test project, both test members, E2E_ENABLE_SUPABASE=1, E2E_ALLOW_MUTATIONS=1, and E2E_USER_EMAIL/E2E_USER_PASSWORD/E2E_PEER_DISPLAY_NAME.");

    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await page.goto("/auth/login");
    await page.getByLabel("Email address").fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/protected(?:$|[?#])/);

    await page.getByRole("button", { name: "Start a conversation" }).click();
    await page.getByLabel("Search members by display name").fill(peerName!);
    await page.getByRole("button", { name: "Search" }).click();
    const peerResult = page.getByRole("listitem").filter({ hasText: peerName! });
    await expect(peerResult).toBeVisible();
    await peerResult.getByRole("button", { name: "Message" }).click();
    await page.getByRole("link", { name: "Open chat" }).click();
    await expect(page.getByRole("heading", { name: peerName!, exact: true })).toBeVisible();
    const directMessage = `Playwright direct ${unique}`;
    await page.getByRole("textbox", { name: "Write a message" }).fill(directMessage);
    await page.getByRole("textbox", { name: "Write a message" }).press("Enter");
    await expect(page.getByText(directMessage, { exact: true })).toBeVisible();

    await page.goto("/protected");
    await page.getByRole("button", { name: "Start a conversation" }).click();
    await page.getByLabel("Search members by display name").fill(peerName!);
    await page.getByRole("button", { name: "Search" }).click();
    const groupPeerResult = page.getByRole("listitem").filter({ hasText: peerName! });
    await expect(groupPeerResult).toBeVisible();
    await groupPeerResult.getByRole("checkbox", { name: `Add ${peerName} to group` }).check();
    const groupName = `Playwright ${unique}`;
    await page.getByLabel("Create a group").fill(groupName);
    await page.getByRole("button", { name: "Create (1/20)" }).click();
    await page.getByRole("link", { name: "Open your group" }).click();
    await expect(page.getByRole("heading", { name: groupName, exact: true })).toBeVisible();
    const groupMessage = `Playwright group ${unique}`;
    await page.getByRole("textbox", { name: "Write a message" }).fill(groupMessage);
    await page.getByRole("textbox", { name: "Write a message" }).press("Enter");
    await expect(page.getByText(groupMessage, { exact: true })).toBeVisible();
  });
});

test.describe("Supabase sign-up journey", () => {
  const name = process.env.E2E_SIGNUP_DISPLAY_NAME;
  const email = process.env.E2E_SIGNUP_EMAIL;
  const password = process.env.E2E_SIGNUP_PASSWORD;

  test("a dedicated test address can submit sign-up", async ({ page }) => {
    test.skip(!name || !email || !password, "Set E2E_SIGNUP_DISPLAY_NAME, E2E_SIGNUP_EMAIL, and E2E_SIGNUP_PASSWORD to run the sign-up flow against a dedicated Supabase test project.");

    await page.goto("/auth/sign-up");
    await page.getByLabel("Your name").fill(name!);
    await page.getByLabel("Email address").fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("checkbox", { name: /I agree to the Terms and Privacy Policy/ }).check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/auth\/sign-up-success(?:$|[?#])/);
  });
});
