"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { validateEmail, validateNewPassword, validateSignIn, validateSignUp } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  success?: string | null;
};

function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) {
    try {
      const parsedUrl = new URL(configuredUrl);
      if (parsedUrl.protocol === "https:" || parsedUrl.hostname === "localhost") {
        return parsedUrl.origin;
      }
    } catch {
      return "http://localhost:3000";
    }
  }

  const deploymentUrl = process.env.VERCEL_URL?.trim();
  if (deploymentUrl) return `https://${deploymentUrl}`;
  return "http://localhost:3000";
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateSignIn(formData);
  if (!validation.success) return { error: validation.error };

  let errorOccurred = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(validation.data);
    errorOccurred = Boolean(error);
  } catch {
    errorOccurred = true;
  }

  if (errorOccurred) {
    return { error: "Email or password is incorrect, or sign-in is temporarily unavailable." };
  }

  revalidatePath("/", "layout");
  redirect("/protected");
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateSignUp(formData);
  if (!validation.success) return { error: validation.error };

  let errorOccurred = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
      options: {
        data: { display_name: validation.data.displayName },
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/protected`,
      },
    });
    errorOccurred = Boolean(error);
  } catch {
    errorOccurred = true;
  }

  if (errorOccurred) {
    return { error: "We couldn’t create your account. Check your details or try signing in." };
  }

  redirect("/auth/sign-up-success");
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Clear the local view even if the auth service cannot be reached.
  }
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateEmail(formData);
  if (!validation.success) return { error: validation.error };

  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(validation.data.email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/auth/update-password`,
    });
  } catch {
    // Use the same confirmation for unknown addresses and service failures.
  }

  return { error: null, success: "If the address can receive a reset link, you’ll get an email shortly." };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateNewPassword(formData);
  if (!validation.success) return { error: validation.error };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: validation.data.password });
    if (error) return { error: "We couldn’t update your password. Request a fresh reset link and try again." };
  } catch {
    return { error: "We couldn’t update your password. Request a fresh reset link and try again." };
  }

  revalidatePath("/", "layout");
  redirect("/protected");
}
