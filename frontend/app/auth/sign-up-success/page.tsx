import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { AuthFrame } from "@/components/auth/auth-frame";

export default function Page() {
  return (
    <AuthFrame eyebrow="One last step" title="Check your email" description="We sent a confirmation link if the address can be registered.">
          <Card>
            <CardHeader><CardTitle className="text-xl">Confirm your account</CardTitle><CardDescription>Open the message from Commonroom to finish creating your account.</CardDescription></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">If this address is already registered, try signing in instead.</p>
              <Link href="/auth/login" className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline">Back to sign in</Link>
            </CardContent>
          </Card>
    </AuthFrame>
  );
}
