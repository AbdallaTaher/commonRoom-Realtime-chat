import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const requestedType = searchParams.get("type");
  const allowedTypes: EmailOtpType[] = ["signup", "recovery", "email", "email_change", "invite", "magiclink"];
  const type = allowedTypes.includes(requestedType as EmailOtpType)
    ? (requestedType as EmailOtpType)
    : null;
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\")
    ? requestedNext
    : "/protected";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/auth/error?reason=confirmation");
}
