"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null };

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="email">Email address</Label>
          <div className="auth-input-wrap">
            <Mail aria-hidden="true" className="auth-input-icon" />
            <Input id="email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required className="auth-input !pl-11" />
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/auth/forgot-password" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="auth-input-wrap">
            <LockKeyhole aria-hidden="true" className="auth-input-icon" />
            <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" minLength={8} maxLength={72} placeholder="Enter your password" required className="auth-input !pl-11 pr-12" />
            <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
        </div>
        {state.error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
        <SubmitButton pendingText="Signing in…">Sign in <ArrowRight aria-hidden="true" /></SubmitButton>
      </form>
      <p className="text-center text-sm text-muted-foreground">New to Commonroom? <Link href="/auth/sign-up" className="font-bold text-primary hover:underline">Create an account</Link></p>
      <p className="pt-1 text-center text-xs leading-5 text-muted-foreground">By continuing, you agree to our <a href="#terms" className="underline">Terms</a> and <a href="#privacy" className="underline">Privacy Policy</a>.</p>
    </div>
  );
}
