import Link from "next/link";
import { AuthFrame } from "@/components/auth/auth-frame";

export default function Page() {
  return (
    <AuthFrame eyebrow="Sign-in issue" title="We couldn’t finish signing you in" description="The sign-in link may have expired, been cancelled, or could not be verified. Please try again.">
      <Link href="/auth/login" className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Back to sign in</Link>
    </AuthFrame>
  );
}
