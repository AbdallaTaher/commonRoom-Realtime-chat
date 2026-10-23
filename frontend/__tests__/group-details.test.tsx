import { render, screen } from "@testing-library/react";

import { GroupDetails } from "@/components/protected/group-details";

jest.mock("@/components/theme-switcher", () => ({
  ThemeSwitcher: () => <button type="button" aria-label="Theme">Theme</button>,
}));

jest.mock("@/lib/actions/groups", () => ({
  addGroupMemberAction: jest.fn(),
  leaveGroupAction: jest.fn(),
  removeGroupMemberAction: jest.fn(),
  renameGroupAction: jest.fn(),
}));

jest.mock("@/lib/actions/profiles", () => ({
  searchMembersAction: jest.fn(),
}));

jest.mock("@/lib/actions/messages", () => ({
  getConversationReadReceiptsAction: jest.fn().mockResolvedValue({ receipts: null }),
  loadOlderMessagesAction: jest.fn(),
  markConversationReadAction: jest.fn().mockResolvedValue({ error: null }),
  searchConversationMessagesAction: jest.fn(),
  sendMessageAction: jest.fn(),
  syncLatestMessagesAction: jest.fn().mockResolvedValue({ error: null, page: null }),
}));

jest.mock("@/lib/realtime/use-conversation-realtime", () => ({
  useConversationRealtime: () => ({ connectionStatus: "connecting", onlineUserIds: [] }),
}));

const ownerId = "c0a8012a-7b3e-4c7f-9d2a-123456789abc";
const groupId = "c0a8012a-7b3e-4c7f-9d2a-123456789abd";
const groupMembers = [
  {
    conversation_id: groupId,
    group_name: "Weekend plans",
    owner_id: ownerId,
    member_id: ownerId,
    display_name: "Alex Morgan",
    is_owner: true,
  },
  {
    conversation_id: groupId,
    group_name: "Weekend plans",
    owner_id: ownerId,
    member_id: "c0a8012a-7b3e-4c7f-9d2a-123456789abe",
    display_name: "Jamie Lee",
    is_owner: true,
  },
];
const emptyMessages: never[] = [];

function renderGroupDetails(members = groupMembers) {
  return render(
    <GroupDetails
      members={members}
      currentUserId={ownerId}
      messages={emptyMessages}
      hasMoreMessages={false}
    />,
  );
}

describe("group details permissions", () => {
  it("shows owner controls and prevents removing the owner", () => {
    renderGroupDetails();

    expect(screen.getByRole("button", { name: "Save group name" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search people to add" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Leave group" })).not.toBeInTheDocument();
  });

  it("shows leave but hides owner-only controls for regular members", () => {
    renderGroupDetails(groupMembers.map((member) => ({ ...member, is_owner: false })));

    expect(screen.getByRole("button", { name: "Leave group" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save group name" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Search people to add" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
