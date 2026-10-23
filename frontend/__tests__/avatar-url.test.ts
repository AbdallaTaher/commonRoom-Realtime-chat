import { getAvatarUrl } from "@/lib/profiles/avatar-url";

describe("avatar URL generation", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  });

  it("returns null when there is no avatar path or project URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.example.supabase.co";
    expect(getAvatarUrl(null)).toBeNull();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(getAvatarUrl("user/avatar.png")).toBeNull();
  });

  it("encodes individual path segments and trims a trailing slash", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.example.supabase.co/";
    expect(getAvatarUrl("user-id/avatar name.webp")).toBe(
      "https://project.example.supabase.co/storage/v1/object/public/avatars/user-id/avatar%20name.webp",
    );
  });
});
