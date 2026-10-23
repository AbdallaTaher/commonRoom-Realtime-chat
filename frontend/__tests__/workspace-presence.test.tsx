import { act, render, screen, waitFor } from "@testing-library/react";

import { useWorkspacePresence, WorkspacePresenceProvider } from "@/lib/realtime/workspace-presence";
import { createClient } from "@/lib/supabase/client";

jest.mock("@/lib/supabase/client", () => ({ createClient: jest.fn() }));

function PresenceLabel() {
  const { onlineUserIds, ready } = useWorkspacePresence();
  return <p>{ready ? onlineUserIds.join(",") : "connecting"}</p>;
}

describe("workspace online presence", () => {
  it("uses an authenticated private channel, tracks the user, and cleans up", async () => {
    const handlers: Record<string, (payload?: unknown) => void> = {};
    let onSubscribe: ((status: string) => void) | undefined;
    const channel: { on: jest.Mock; subscribe: jest.Mock; track: jest.Mock; presenceState: jest.Mock } = {
      on: jest.fn((kind: string, filter: { event: string }, handler: (payload?: unknown) => void) => {
        handlers[`${kind}:${filter.event}`] = handler;
        return channel;
      }),
      subscribe: jest.fn((handler: (status: string) => void) => {
        onSubscribe = handler;
        return channel;
      }),
      track: jest.fn().mockResolvedValue("ok"),
      presenceState: jest.fn(() => ({
        ["member-a"]: [{ user_id: "member-a" }],
        ["member-b"]: [{ user_id: "member-b" }],
      })),
    };
    const client = {
      realtime: { setAuth: jest.fn().mockResolvedValue(undefined) },
      channel: jest.fn(() => channel),
      removeChannel: jest.fn().mockResolvedValue("ok"),
    };
    jest.mocked(createClient).mockReturnValue(client as never);

    const { unmount } = render(
      <WorkspacePresenceProvider currentUserId="member-a">
        <PresenceLabel />
      </WorkspacePresenceProvider>,
    );

    await waitFor(() => expect(client.channel).toHaveBeenCalledWith(
      "members:online",
      { config: { private: true, presence: { key: "member-a" } } },
    ));
    expect(client.realtime.setAuth).toHaveBeenCalledTimes(1);
    act(() => onSubscribe?.("SUBSCRIBED"));
    await waitFor(() => expect(channel.track).toHaveBeenCalledWith({ user_id: "member-a" }));
    act(() => handlers["presence:sync"]());
    expect(screen.getByText("member-a,member-b")).toBeInTheDocument();

    unmount();
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
  });
});
