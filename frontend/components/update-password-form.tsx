"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null };

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-2"><Label htmlFor="password">New password</Label><Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required className="h-12 rounded-xl bg-background/80" /></div>
      <div className="grid gap-2"><Label htmlFor="confirmPassword">Confirm new password</Label><Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required className="h-12 rounded-xl bg-background/80" /></div>
      {state.error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
      <SubmitButton pendingText="Saving…">Save new password</SubmitButton>
    </form>
  );
}
