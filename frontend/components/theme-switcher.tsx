"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      disabled={!mounted}
      aria-label={
        mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Theme"
      }
      aria-pressed={mounted && isDark}
      title={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && isDark ? (
        <Sun aria-hidden="true" />
      ) : (
        <Moon aria-hidden="true" />
      )}
    </Button>
  );
}
