import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

function isValidSupabaseUrl(value: string | undefined): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname) &&
      !url.hostname.includes("your-project")
    );
  } catch {
    return false;
  }
}

export const hasEnvVars = Boolean(
  isValidSupabaseUrl(supabaseUrl) &&
    supabasePublishableKey &&
    supabasePublishableKey !== "your-publishable-key",
);
