import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { AuthFrame } from "@/components/auth/auth-frame";

export default function Page() {
  return (
    <AuthFrame eyebrow="Account recovery" title="Reset your password" description="We’ll send a secure link if the address can receive one.">
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
