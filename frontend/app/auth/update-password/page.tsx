import { UpdatePasswordForm } from "@/components/update-password-form";
import { AuthFrame } from "@/components/auth/auth-frame";

export default function Page() {
  return (
    <AuthFrame eyebrow="Account recovery" title="Choose a new password" description="Use at least 8 characters to secure your account.">
      <UpdatePasswordForm />
    </AuthFrame>
  );
}
