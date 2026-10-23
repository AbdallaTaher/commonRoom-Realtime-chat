import { ThemeProvider } from "next-themes";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { HomePage } from "@/components/home-page";

function renderHomePage() {
  return render(
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="commonroom-theme"
    >
      <HomePage />
    </ThemeProvider>,
  );
}

describe("Commonroom home page", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("shows the welcome message and account links", () => {
    renderHomePage();

    expect(
      screen.getByRole("heading", { name: /good conversations make a good day/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create your account/i })).toHaveAttribute(
      "href",
      "/auth/sign-up",
    );
  });

  it("starts in dark mode and switches themes while remembering the preference", async () => {
    renderHomePage();

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(localStorage.getItem("commonroom-theme")).toBe("dark");
    });

    fireEvent.click(
      await screen.findByRole("button", { name: "Switch to light mode" }),
    );

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");
      expect(localStorage.getItem("commonroom-theme")).toBe("light");
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(localStorage.getItem("commonroom-theme")).toBe("dark");
    });
  });
});
