import { LoginForm } from "@/components/login-form";
import { AuthFrame } from "@/components/auth/auth-frame";

export default function Page() {
  return (
    <AuthFrame eyebrow="Welcome back" title="Sign in to your space" description="Pick up right where your people are.">
      <LoginForm />
    </AuthFrame>
  );
}
