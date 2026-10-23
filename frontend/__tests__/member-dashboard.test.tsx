import { fireEvent, render, screen } from "@testing-library/react";

import { MemberDashboard } from "@/components/protected/member-dashboard";

jest.mock("@/components/theme-switcher", () => ({
  ThemeSwitcher: () => <button type="button" aria-label="Theme">Theme</button>,
}));

jest.mock("@/lib/actions/profiles", () => ({
  saveProfileAction: jest.fn(),
  searchMembersAction: jest.fn(),
}));

jest.mock("@/lib/actions/conversations", () => ({
  startDirectConversationAction: jest.fn(),
}));

jest.mock("@/lib/actions/groups", () => ({
  createGroupAction: jest.fn(),
  addGroupMemberAction: jest.fn(),
  leaveGroupAction: jest.fn(),
  removeGroupMemberAction: jest.fn(),
  renameGroupAction: jest.fn(),
}));

describe("member inbox", () => {
  it("shows the inbox design and profile settings modal", () => {
    render(
      <MemberDashboard
        profile={{ id: "member-1", display_name: "Alex Morgan" }}
        email="alex@example.com"
        currentUserId="member-1"
        conversations={[]}
        groups={[]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Messages" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New conversation" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Your profile" }));
    expect(screen.getByRole("dialog", { name: "Your profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Your display name")).toHaveValue("Alex Morgan");
    expect(screen.getByText("Signed in as alex@example.com")).toBeInTheDocument();
  });

  it("shows profile setup failures and prevents saving without a profile", () => {
    render(<MemberDashboard profile={null} email={null} currentUserId="member-1" conversations={[]} groups={[]} profileLoadFailed />);
    fireEvent.click(screen.getByRole("button", { name: "Your profile" }));

    expect(screen.getByText(/couldn’t load your profile/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save profile" })).toBeDisabled();
  });

  it("lists direct conversations by the other member’s display name", () => {
    render(
      <MemberDashboard
        profile={{ id: "member-1", display_name: "Alex Morgan" }}
        email={null}
        currentUserId="member-1"
        conversations={[{
          conversation_id: "c0a8012a-7b3e-4c7f-9d2a-123456789abc",
          started_at: "2026-10-19T12:00:00.000Z",
          member_id: "member-2",
          display_name: "Jamie Lee",
          last_message_sender_id: null,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
        }]}
        groups={[]}
      />,
    );

    expect(screen.getByRole("link", { name: /Jamie Lee Start a conversation/i })).toHaveAttribute(
      "href",
      "/protected/conversations/c0a8012a-7b3e-4c7f-9d2a-123456789abc",
    );
  });

  it("lists groups with member counts and links to group details", () => {
    render(
      <MemberDashboard
        profile={{ id: "member-1", display_name: "Alex Morgan" }}
        email={null}
        currentUserId="member-1"
        conversations={[]}
        groups={[{
          conversation_id: "c0a8012a-7b3e-4c7f-9d2a-123456789abc",
          group_name: "Weekend plans",
          owner_id: "member-1",
          started_at: "2026-10-19T12:00:00.000Z",
          member_count: 3,
          member_ids: ["member-1", "member-2", "member-3"],
          last_message_sender_id: null,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
        }]}
      />,
    );

    expect(screen.getByRole("link", { name: /Weekend plans 3 members/i })).toHaveAttribute(
      "href",
      "/protected/groups/c0a8012a-7b3e-4c7f-9d2a-123456789abc",
    );
  });
});
