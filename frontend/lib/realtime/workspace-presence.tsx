"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { createClient } from "@/lib/supabase/client";

type WorkspacePresenceValue = {
  onlineUserIds: string[];
  ready: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected";
};
const WorkspacePresenceContext = createContext<WorkspacePresenceValue>({
  onlineUserIds: [], ready: false, connectionStatus: "connecting",
});

export function WorkspacePresenceProvider({ currentUserId, children }: {
  currentUserId: string;
  children: ReactNode;
}) {
  const [value, setValue] = useState<WorkspacePresenceValue>({
    onlineUserIds: [], ready: false, connectionStatus: "connecting",
  });

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();

    async function connect() {
      try {
        await supabase.realtime.setAuth();
        if (cancelled) return;

        channel = supabase.channel("members:online", {
          config: { private: true, presence: { key: currentUserId } },
        });
        channel.on("presence", { event: "sync" }, () => {
          if (!channel || cancelled) return;
          const state = channel.presenceState() as Record<string, Array<{ user_id?: unknown }>>;
          const ids = new Set<string>();
          Object.values(state).flat().forEach((presence) => {
            if (typeof presence.user_id === "string") ids.add(presence.user_id);
          });
          setValue((current) => ({ ...current, onlineUserIds: [...ids], ready: true }));
        });
        channel.subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            const activeChannel = channel;
            if (!activeChannel) return;
            setValue({ onlineUserIds: [], ready: true, connectionStatus: "connecting" });
            void activeChannel.track({ user_id: currentUserId }).then((trackStatus) => {
              if (cancelled) return;
              if (trackStatus === "ok") {
                setValue((current) => ({ ...current, ready: true, connectionStatus: "connected" }));
              } else {
                setValue({ onlineUserIds: [], ready: true, connectionStatus: "disconnected" });
              }
            }).catch(() => {
              if (!cancelled) setValue({ onlineUserIds: [], ready: true, connectionStatus: "disconnected" });
            });
          } else {
            setValue({ onlineUserIds: [], ready: true, connectionStatus: "disconnected" });
          }
        });
      } catch {
        if (!cancelled) setValue({ onlineUserIds: [], ready: true, connectionStatus: "disconnected" });
      }
    }

    void connect();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return <WorkspacePresenceContext.Provider value={value}>{children}</WorkspacePresenceContext.Provider>;
}

export function useWorkspacePresence() {
  return useContext(WorkspacePresenceContext);
}
