jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/groups/service", () => ({
  addGroupMember: jest.fn(),
  createGroup: jest.fn(),
  leaveGroup: jest.fn(),
  removeGroupMember: jest.fn(),
  renameGroup: jest.fn(),
}));

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { leaveGroup } from "@/lib/groups/service";
import { createClient } from "@/lib/supabase/server";
import { leaveGroupAction } from "@/lib/actions/groups";

describe("leaveGroupAction", () => {
  const groupId = "c0a8012a-7b3e-4c7f-9d2a-123456789abc";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createClient).mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);
    jest.mocked(leaveGroup).mockResolvedValue({ data: groupId, error: null });
  });

  it("revalidates the inbox and redirects away from the group after a successful leave", async () => {
    const formData = new FormData();
    formData.set("groupId", groupId);

    await expect(
      leaveGroupAction({ error: null, success: null }, formData),
    ).rejects.toThrow("REDIRECT:/protected");

    expect(leaveGroup).toHaveBeenCalledWith({}, groupId);
    expect(revalidatePath).toHaveBeenCalledWith("/protected");
    expect(redirect).toHaveBeenCalledWith("/protected");
  });

  it("keeps the user on the group page when the database rejects the leave", async () => {
    jest.mocked(leaveGroup).mockResolvedValue({ data: null, error: {} as never });
    const formData = new FormData();
    formData.set("groupId", groupId);

    await expect(
      leaveGroupAction({ error: null, success: null }, formData),
    ).resolves.toEqual({
      error: "You can’t leave as the owner. Group owners can’t leave their own group.",
      success: null,
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
