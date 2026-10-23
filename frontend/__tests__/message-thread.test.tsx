import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MessageThread } from "@/components/protected/message-thread";
import { loadOlderMessagesAction, sendMessageAction } from "@/lib/actions/messages";
import {
  getConversationReadReceiptsAction,
  markConversationReadAction,
  searchConversationMessagesAction,
} from "@/lib/actions/messages";
import type { Message } from "@/lib/messages/service";

jest.mock("@/components/theme-switcher", () => ({
  ThemeSwitcher: () => <button type="button" aria-label="Theme">Theme</button>,
}));

jest.mock("@/lib/actions/messages", () => ({
  loadOlderMessagesAction: jest.fn(),
  getConversationReadReceiptsAction: jest.fn(),
  markConversationReadAction: jest.fn(),
  searchConversationMessagesAction: jest.fn(),
  sendMessageAction: jest.fn(),
}));
jest.mock("@/lib/realtime/use-conversation-realtime", () => ({
  useConversationRealtime: () => ({ connectionStatus: "connecting", onlineUserIds: [] }),
}));

const conversationId = "c0a8012a-7b3e-4c7f-9d2a-123456789abc";
const senderId = "c0a8012a-7b3e-4c7f-9d2a-123456789abd";
const otherId = "c0a8012a-7b3e-4c7f-9d2a-123456789abe";
const initialMessage: Message = {
  id: "c0a8012a-7b3e-4c7f-9d2a-123456789abf",
  conversation_id: conversationId,
  sender_id: otherId,
  content: "Hi there",
  created_at: "2026-10-21T12:30:45.123Z",
};

describe("message thread", () => {
  beforeEach(() => {
    jest.mocked(markConversationReadAction).mockResolvedValue({ error: null });
    jest.mocked(getConversationReadReceiptsAction).mockResolvedValue({ receipts: null });
    jest.mocked(searchConversationMessagesAction).mockResolvedValue({ error: null, messages: [] });
    jest.mocked(sendMessageAction).mockResolvedValue({
      error: null,
      message: {
        ...initialMessage,
        id: "c0a8012a-7b3e-4c7f-9d2a-123456789ac0",
        sender_id: senderId,
        content: "Hello back",
      },
    });
  });

  it("shows a clear empty conversation state", () => {
    render(
      <MessageThread
        conversationId={conversationId}
        currentUserId={senderId}
        initialMessages={[]}
        hasMore={false}
        memberNames={{}}
      />,
    );

    expect(screen.getByText("No messages yet")).toBeInTheDocument();
  });

  it("sends a message, renders it, and gives the request an idempotency key", async () => {
    jest.spyOn(crypto, "randomUUID").mockReturnValue("c0a8012a-7b3e-4c7f-9d2a-123456789ac1");
    render(
      <MessageThread
        conversationId={conversationId}
        currentUserId={senderId}
        initialMessages={[initialMessage]}
        hasMore={false}
        memberNames={{ [otherId]: "Jamie Lee" }}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Write a message" });
    fireEvent.change(input, { target: { value: "Hello back" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(screen.getByText("Hello back")).toBeInTheDocument());
    const request = jest.mocked(sendMessageAction).mock.calls[0][0];
    expect(request.get("conversationId")).toBe(conversationId);
    expect(request.get("clientMessageId")).toBe("c0a8012a-7b3e-4c7f-9d2a-123456789ac1");
    expect(loadOlderMessagesAction).not.toHaveBeenCalled();
  });

  it("sends the draft on Enter", async () => {
    render(
      <MessageThread
        conversationId={conversationId}
        currentUserId={senderId}
        initialMessages={[]}
        hasMore={false}
        memberNames={{}}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Write a message" });
    fireEvent.change(input, { target: { value: "Send this" } });
    input.focus();
    const enter = fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    expect(enter).toBe(false);
    await waitFor(() => expect(sendMessageAction).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(input).toHaveFocus());
  });

  it("leaves Shift+Enter available for inserting a newline", () => {
    render(
      <MessageThread
        conversationId={conversationId}
        currentUserId={senderId}
        initialMessages={[]}
        hasMore={false}
        memberNames={{}}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Write a message" });
    const shiftEnter = fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(shiftEnter).toBe(true);
    expect(sendMessageAction).not.toHaveBeenCalled();
  });

  it("searches messages and replaces the visible history with matches", async () => {
    jest.mocked(searchConversationMessagesAction).mockResolvedValueOnce({
      error: null,
      messages: [initialMessage],
    });
    render(
      <MessageThread
        conversationId={conversationId}
        currentUserId={senderId}
        initialMessages={[]}
        hasMore={false}
        memberNames={{ [otherId]: "Jamie Lee" }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Search messages" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Search messages" }), { target: { value: "there" } });
    fireEvent.submit(screen.getByRole("textbox", { name: "Search messages" }).closest("form")!);

    expect(await screen.findByText("Hi there")).toBeInTheDocument();
    expect(screen.getByText("1 matching messages")).toBeInTheDocument();
  });

  it("keeps the draft and shows a retry message when sending fails", async () => {
    jest.mocked(sendMessageAction).mockResolvedValueOnce({ error: "Send failed. Try again.", message: null });
    render(
      <MessageThread
        conversationId={conversationId}
        currentUserId={senderId}
        initialMessages={[]}
        hasMore={false}
        memberNames={{}}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Write a message" });
    fireEvent.change(input, { target: { value: "Please save this" } });
    fireEvent.submit(input.closest("form")!);

    expect(await screen.findByText("Send failed. Try again.")).toBeInTheDocument();
    expect(input).toHaveValue("Please save this");
  });
});
