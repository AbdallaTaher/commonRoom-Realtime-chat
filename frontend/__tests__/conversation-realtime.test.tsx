import { act, renderHook, waitFor } from "@testing-library/react";

import { useConversationRealtime } from "@/lib/realtime/use-conversation-realtime";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/messages/service";

jest.mock("@/lib/supabase/client", () => ({ createClient: jest.fn() }));

const conversationId = "c0a8012a-7b3e-4c7f-9d2a-123456789abc";
const currentUserId = "c0a8012a-7b3e-4c7f-9d2a-123456789abd";
const otherUserId = "c0a8012a-7b3e-4c7f-9d2a-123456789abe";
const newMessage: Message = {
  id: "c0a8012a-7b3e-4c7f-9d2a-123456789abf",
  conversation_id: conversationId,
  sender_id: otherUserId,
  content: "A live message",
  created_at: "2026-10-23T10:00:00.000Z",
};

describe("conversation realtime channel", () => {
  it("authenticates a private channel, handles messages and presence, reconnects, and cleans up", async () => {
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
        [otherUserId]: [{ user_id: otherUserId }],
        [currentUserId]: [{ user_id: currentUserId }],
      })),
    };
    const client = {
      realtime: { setAuth: jest.fn().mockResolvedValue(undefined) },
      channel: jest.fn(() => channel),
      removeChannel: jest.fn().mockResolvedValue("ok"),
    };
    jest.mocked(createClient).mockReturnValue(client as never);
    const onMessage = jest.fn();
    const onChannelReady = jest.fn();

    const { result, unmount } = renderHook(() => useConversationRealtime({
      conversationId,
      currentUserId,
      onMessage,
      onChannelReady,
    }));

    await waitFor(() => expect(client.channel).toHaveBeenCalledWith(
      `conversation:${conversationId}`,
      expect.objectContaining({ config: expect.objectContaining({ private: true }) }),
    ));
    expect(client.realtime.setAuth).toHaveBeenCalledTimes(1);

    act(() => onSubscribe?.("SUBSCRIBED"));
    await waitFor(() => expect(channel.track).toHaveBeenCalledWith({ user_id: currentUserId }));
    expect(result.current.connectionStatus).toBe("connected");
    expect(onChannelReady).toHaveBeenCalledTimes(1);

    act(() => handlers["presence:sync"]());
    expect(result.current.onlineUserIds).toEqual(expect.arrayContaining([currentUserId, otherUserId]));

    act(() => handlers["broadcast:INSERT"]({ payload: { record: newMessage } }));
    expect(onMessage).toHaveBeenCalledWith(newMessage);

    act(() => onSubscribe?.("CHANNEL_ERROR"));
    expect(result.current.connectionStatus).toBe("reconnecting");
    expect(result.current.onlineUserIds).toEqual([]);

    act(() => onSubscribe?.("SUBSCRIBED"));
    await waitFor(() => expect(channel.track).toHaveBeenCalledTimes(2));
    expect(onChannelReady).toHaveBeenCalledTimes(2);

    unmount();
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
  });

  it("ignores malformed and unrelated broadcast records", async () => {
    const handlers: Record<string, (payload?: unknown) => void> = {};
    const channel: { on: jest.Mock; subscribe: jest.Mock; track: jest.Mock; presenceState: jest.Mock } = {
      on: jest.fn((kind: string, filter: { event: string }, handler: (payload?: unknown) => void) => {
        handlers[`${kind}:${filter.event}`] = handler;
        return channel;
      }),
      subscribe: jest.fn(() => channel),
      track: jest.fn().mockResolvedValue("ok"),
      presenceState: jest.fn(() => ({})),
    };
    jest.mocked(createClient).mockReturnValue({
      realtime: { setAuth: jest.fn().mockResolvedValue(undefined) },
      channel: jest.fn(() => channel),
      removeChannel: jest.fn().mockResolvedValue("ok"),
    } as never);
    const onMessage = jest.fn();
    const { unmount } = renderHook(() => useConversationRealtime({
      conversationId,
      currentUserId,
      onMessage,
      onChannelReady: jest.fn(),
    }));

    await waitFor(() => expect(handlers["broadcast:INSERT"]).toBeDefined());
    act(() => handlers["broadcast:INSERT"]({ payload: { record: { ...newMessage, content: 42 } } }));
    act(() => handlers["broadcast:INSERT"]({ payload: { record: { ...newMessage, conversation_id: otherUserId } } }));
    expect(onMessage).not.toHaveBeenCalled();
    unmount();
  });
});
