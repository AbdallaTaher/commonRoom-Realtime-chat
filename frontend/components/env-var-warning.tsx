export function EnvVarWarning() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
      <p className="font-semibold">Supabase connection needs setup.</p>
      <p className="mt-1 text-muted-foreground">
        Check that `frontend/.env.local` contains a valid project URL and
        publishable key, then restart the development server.
      </p>
    </div>
  );
}
