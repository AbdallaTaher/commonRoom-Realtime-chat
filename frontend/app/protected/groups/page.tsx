import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Mountain, Plus, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getGroups } from "@/lib/groups/service";
import { createClient } from "@/lib/supabase/server";

async function GroupsContent() {
  await connection();
  const client = await createClient();
  const { data, error } = await getGroups(client);
  const groups = data ?? [];

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-5 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Your conversations</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Groups</h1>
          <p className="mt-2 text-sm text-muted-foreground">Open a group conversation or create a space for more people.</p>
        </div>
        <Button asChild><Link href="/protected/contacts?mode=group"><Plus aria-hidden="true" />Create a group</Link></Button>
      </header>

      {error ? (
        <p className="rounded-2xl border border-destructive/30 bg-card/90 p-5 text-sm text-destructive" role="alert">
          We couldn’t load your groups. Refresh the page and try again.
        </p>
      ) : groups.length === 0 ? (
        <section className="rounded-3xl border border-border/70 bg-card/90 px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Mountain aria-hidden="true" /></span>
          <h2 className="mt-5 text-xl font-bold">No groups yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Create your first group, choose members from Contacts, and start chatting together.</p>
          <Button asChild className="mt-5"><Link href="/protected/contacts?mode=group"><Plus aria-hidden="true" />Create a group</Link></Button>
        </section>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <li key={group.conversation_id}>
              <Link href={`/protected/groups/${group.conversation_id}`} className="flex h-full min-h-28 items-center gap-4 rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm transition hover:border-primary/40 hover:bg-accent/40">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Mountain aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate">{group.group_name}</strong>
                  <small className="mt-1 block text-muted-foreground">{group.member_count} members</small>
                  <small className="mt-1 block truncate text-muted-foreground">{group.last_message ?? "No messages yet"}</small>
                </span>
                <UsersRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function GroupsRoute() {
  return (
    <Suspense fallback={<main className="p-8 text-sm text-muted-foreground">Loading groups…</main>}>
      <GroupsContent />
    </Suspense>
  );
}
