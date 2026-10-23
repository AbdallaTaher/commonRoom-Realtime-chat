import { expect, test } from "@playwright/test";

test.describe("portfolio demo sandbox", () => {
  test("home page provides a direct link to the public demo", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Try the interactive demo" }).click();

    await expect(page).toHaveURL(/\/demo$/);
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await expect(page.getByText(/Fictional sample data/)).toBeVisible();
  });

  test("demo loads without an account or Supabase browser requests", async ({ page }) => {
    const supabaseRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes(".supabase.co")) supabaseRequests.push(request.url());
    });

    await page.goto("/demo");

    await expect(page.getByRole("heading", { name: "Sofia Chen" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/auth/sign-up");
    expect(supabaseRequests).toEqual([]);
  });

  test("conversations can be selected, searched, and filtered", async ({ page }) => {
    await page.goto("/demo");
    await page.getByRole("button", { name: /Weekend hikers/ }).click();
    await expect(page.getByRole("heading", { name: "Weekend hikers" })).toBeVisible();

    await page.locator(".inbox-filters").getByRole("button", { name: "Groups" }).click();
    await expect(page.getByRole("button", { name: /Weekend hikers/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sofia Chen/ })).toHaveCount(0);

    await page.getByRole("textbox", { name: "Search demo conversations" }).fill("Studio");
    await expect(page.getByRole("button", { name: /Studio friends/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Weekend hikers/ })).toHaveCount(0);
  });

  test("Enter sends a local message, Shift+Enter adds a line, and focus stays in the composer", async ({ page }) => {
    await page.goto("/demo");
    const composer = page.getByRole("textbox", { name: "Write a demo message" });
    await composer.fill("A first line");
    await composer.press("Shift+Enter");
    await composer.pressSequentially("A second line");
    await composer.press("Enter");

    await expect(page.getByText("A first line\nA second line", { exact: true })).toBeVisible();
    await expect(composer).toBeEmpty();
    await expect(composer).toBeFocused();
  });

  test("mobile visitors can open a conversation and return to the list", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/demo");
    await page.getByRole("button", { name: /Sofia Chen/ }).click();

    await expect(page.getByRole("heading", { name: "Sofia Chen" })).toBeVisible();
    await page.getByRole("button", { name: "Back to conversations" }).click();
    await expect(page.getByRole("complementary", { name: "Demo conversations" })).toBeVisible();
  });
});
