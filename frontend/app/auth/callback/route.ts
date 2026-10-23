import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/protected";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));
  const authError = requestUrl.searchParams.get("error");
  const code = requestUrl.searchParams.get("code");

  if (authError || !code) {
    return NextResponse.redirect(new URL("/auth/error?reason=callback", requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/auth/error?reason=callback", requestUrl.origin));
    }
  } catch {
    return NextResponse.redirect(new URL("/auth/error?reason=callback", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
