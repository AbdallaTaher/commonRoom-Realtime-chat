import { AuthFrame } from "@/components/auth/auth-frame";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <AuthFrame
      centered
      eyebrow="Your people are here"
      title="Create your account"
      description="A few details, then you’re in."
    >
      <SignUpForm />
    </AuthFrame>
  );
}
