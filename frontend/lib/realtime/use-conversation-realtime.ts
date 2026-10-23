"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/messages/service";

type ConnectionStatus = "connecting" | "connected" | "reconnecting";
type RealtimeEnvelope = { payload?: unknown };

function asMessage(value: unknown): Message | null {
  if (!value || typeof value !== "object") return null;
  const envelope = value as Record<string, unknown>;
  const payload = envelope.payload;
  if (!payload || typeof payload !== "object") return null;

  const body = payload as Record<string, unknown>;
  const record = (body.record ?? body.new) as Record<string, unknown> | undefined;
  if (!record
    || typeof record.id !== "string"
    || typeof record.conversation_id !== "string"
    || typeof record.sender_id !== "string"
    || typeof record.content !== "string"
    || typeof record.created_at !== "string") return null;

  return {
    id: record.id,
    conversation_id: record.conversation_id,
    sender_id: record.sender_id,
    content: record.content,
    created_at: record.created_at,
  };
}

export function useConversationRealtime({
  conversationId,
  currentUserId,
  onMessage,
  onChannelReady,
  onReadReceipt,
}: {
  conversationId: string;
  currentUserId: string;
  onMessage: (message: Message) => void;
  onChannelReady: () => void;
  onReadReceipt?: () => void;
}) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const onMessageRef = useRef(onMessage);
  const onChannelReadyRef = useRef(onChannelReady);
  const onReadReceiptRef = useRef(onReadReceipt);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onChannelReadyRef.current = onChannelReady;
    onReadReceiptRef.current = onReadReceipt;
  }, [onMessage, onChannelReady, onReadReceipt]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();
    setConnectionStatus("connecting");
    setOnlineUserIds([]);

    async function connect() {
      try {
        await supabase.realtime.setAuth();
        if (cancelled) return;

        channel = supabase
          .channel(`conversation:${conversationId}`, {
            config: {
              private: true,
              broadcast: { self: false },
              presence: { key: currentUserId },
            },
          })
          .on("broadcast", { event: "INSERT" }, (event: RealtimeEnvelope) => {
            const message = asMessage(event);
            if (message?.conversation_id === conversationId) onMessageRef.current(message);
          })
          .on("broadcast", { event: "READ_RECEIPT" }, () => {
            onReadReceiptRef.current?.();
          })
          .on("presence", { event: "sync" }, () => {
            if (!channel || cancelled) return;
            const state = channel.presenceState() as Record<string, Array<{ user_id?: unknown }>>;
            const users = new Set<string>();
            Object.values(state).flat().forEach((presence) => {
              if (typeof presence.user_id === "string") users.add(presence.user_id);
            });
            setOnlineUserIds([...users]);
          })
          .subscribe((status) => {
            if (cancelled) return;
            if (status === "SUBSCRIBED") {
              const activeChannel = channel;
              if (!activeChannel) return;
              setConnectionStatus("connected");
              onChannelReadyRef.current();
              void activeChannel.track({ user_id: currentUserId }).then((trackStatus) => {
                if (!cancelled && trackStatus !== "ok") {
                  setConnectionStatus("reconnecting");
                  setOnlineUserIds([]);
                }
              }).catch(() => {
                if (!cancelled) {
                  setConnectionStatus("reconnecting");
                  setOnlineUserIds([]);
                }
              });
            } else {
              setConnectionStatus("reconnecting");
              setOnlineUserIds([]);
            }
          });
      } catch {
        if (!cancelled) setConnectionStatus("reconnecting");
      }
    }

    void connect();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  return { connectionStatus, onlineUserIds };
}
