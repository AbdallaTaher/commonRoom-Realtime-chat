import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { ContactsPage } from "@/components/protected/contacts-page";
import { createClient } from "@/lib/supabase/server";

async function ContactsContent({ searchParams }: {
  searchParams: Promise<{ mode?: string }>;
}) {
  await connection();
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  if (error || typeof data?.claims?.sub !== "string") redirect("/auth/login");

  const params = await searchParams;
  return <ContactsPage groupMode={params.mode === "group"} />;
}

export default function ContactsRoute({ searchParams }: {
  searchParams: Promise<{ mode?: string }>;
}) {
  return (
    <Suspense fallback={<main className="p-8 text-sm text-muted-foreground">Loading contacts…</main>}>
      <ContactsContent searchParams={searchParams} />
    </Suspense>
  );
}
