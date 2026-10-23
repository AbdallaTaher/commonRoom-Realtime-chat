"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null };

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, initialState);
  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="displayName">Your name</Label>
          <Input id="displayName" name="displayName" autoComplete="name" minLength={2} maxLength={60} required className="h-12 rounded-xl border-slate-200 bg-white/80 px-4" placeholder="Alex Morgan" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" autoComplete="email" maxLength={254} required className="h-12 rounded-xl border-slate-200 bg-white/80 px-4" placeholder="you@example.com" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required className="h-12 rounded-xl border-slate-200 bg-white/80 px-4" placeholder="At least 8 characters" />
          <span className="text-xs text-muted-foreground">Use at least 8 characters.</span>
        </div>
        <label className="flex items-start gap-3 text-sm leading-5 text-muted-foreground">
          <input type="checkbox" name="terms" required className="mt-1 size-4 accent-primary" />
          <span>I agree to the <a href="#terms" className="font-semibold text-primary underline">Terms</a> and <a href="#privacy" className="font-semibold text-primary underline">Privacy Policy</a>.</span>
        </label>
        {state.error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
        <SubmitButton pendingText="Creating your account…">Create account <ArrowRight aria-hidden="true" /></SubmitButton>
      </form>
      <p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/auth/login" className="font-bold text-primary hover:underline">Sign in</Link></p>
    </div>
  );
}
