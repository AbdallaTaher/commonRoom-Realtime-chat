export function getAvatarUrl(path: string | null | undefined): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !baseUrl) return null;

  const safePath = path.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/avatars/${safePath}`;
}
