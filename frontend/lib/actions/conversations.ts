"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { startDirectConversation } from "@/lib/conversations/service";
import { validateMemberId } from "@/lib/conversations/validation";

export type StartConversationState = {
  error: string | null;
  conversationId: string | null;
};

export async function startDirectConversationAction(
  _previousState: StartConversationState,
  formData: FormData,
): Promise<StartConversationState> {
  const validation = validateMemberId(formData.get("memberId"));
  if (!validation.success) return { error: validation.error, conversationId: null };

  try {
    const supabase = await createClient();
    const { data, error } = await startDirectConversation(supabase, validation.value);
    if (error || !data) {
      return { error: "We couldn’t start this conversation. Refresh the page and try again.", conversationId: null };
    }

    revalidatePath("/protected");
    return { error: null, conversationId: data };
  } catch {
    return { error: "We couldn’t start this conversation. Check your connection and try again.", conversationId: null };
  }
}
