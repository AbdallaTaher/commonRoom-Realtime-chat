export type DemoMessage = {
  id: string;
  sender: string;
  content: string;
  time: string;
  mine: boolean;
};

export type DemoConversation = {
  id: string;
  name: string;
  kind: "direct" | "group";
  initials: string;
  status: string;
  online: boolean;
  unreadCount: number;
  messages: DemoMessage[];
};

export const initialDemoConversations: DemoConversation[] = [
  {
    id: "sofia",
    name: "Sofia Chen",
    kind: "direct",
    initials: "SC",
    status: "Online now",
    online: true,
    unreadCount: 1,
    messages: [
      { id: "sofia-1", sender: "Sofia", content: "Hey Alex! Are we still on for the little coffee place by the park? ☕", time: "10:32 AM", mine: false },
      { id: "sofia-2", sender: "Alex", content: "Absolutely! I’ve been wanting to try their new patio.", time: "10:35 AM", mine: true },
      { id: "sofia-3", sender: "Sofia", content: "Perfect. I can get there around 3 if that works for you?", time: "10:36 AM", mine: false },
      { id: "sofia-4", sender: "Alex", content: "That sounds perfect! See you there ✨", time: "10:38 AM", mine: true },
    ],
  },
  {
    id: "hikers",
    name: "Weekend hikers",
    kind: "group",
    initials: "WH",
    status: "3 members",
    online: false,
    unreadCount: 1,
    messages: [
      { id: "hikers-1", sender: "Maya", content: "Trail looks lovely this weekend. Anyone free Saturday?", time: "9:14 AM", mine: false },
      { id: "hikers-2", sender: "Alex", content: "I’m in! I’ll bring snacks.", time: "9:21 AM", mine: true },
      { id: "hikers-3", sender: "Jamie", content: "Count me in too 🥾", time: "9:27 AM", mine: false },
    ],
  },
  {
    id: "jamie",
    name: "Jamie Rivera",
    kind: "direct",
    initials: "JR",
    status: "Offline",
    online: false,
    unreadCount: 0,
    messages: [
      { id: "jamie-1", sender: "Jamie", content: "Made a playlist for the road. Hope you like it 🎧", time: "Yesterday · 4:12 PM", mine: false },
      { id: "jamie-2", sender: "Alex", content: "Already listening. Great picks!", time: "Yesterday · 4:20 PM", mine: true },
    ],
  },
  {
    id: "studio",
    name: "Studio friends",
    kind: "group",
    initials: "SF",
    status: "4 members",
    online: false,
    unreadCount: 0,
    messages: [
      { id: "studio-1", sender: "Sam", content: "Loved seeing everyone at the studio. Same time next month?", time: "Yesterday · 2:32 PM", mine: false },
      { id: "studio-2", sender: "Alex", content: "Absolutely. I’ll bring the new sketches!", time: "Yesterday · 2:41 PM", mine: true },
    ],
  },
];
