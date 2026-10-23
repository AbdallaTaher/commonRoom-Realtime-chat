"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null, success: null };

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState);
  return state.success ? (
    <div className="space-y-5">
      <p role="status" className="rounded-xl bg-primary/10 p-4 text-sm">{state.success}</p>
      <Link href="/auth/login" className="block text-center text-sm font-semibold text-primary hover:underline">Back to sign in</Link>
    </div>
  ) : (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" maxLength={254} required className="h-12 rounded-xl bg-background/80" placeholder="you@example.com" /></div>
      {state.error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
      <Link href="/auth/login" className="block text-center text-sm text-muted-foreground hover:text-primary">Back to sign in</Link>
    </form>
  );
}
