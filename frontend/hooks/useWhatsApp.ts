import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { handleApiError } from "@/lib/api";
import type { WhatsAppMessage, Conversation, ApiResponse } from "@/types";
import { toast } from "sonner";

export function useWhatsApp() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["whatsappConversations"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Record<string, WhatsAppMessage[]>>>(
        "/whatsapp/conversations"
      );
      
      // Transform data into conversations array
      const conversations: Conversation[] = Object.entries(data.data || {}).map(
        ([threadId, messages]) => ({
          threadId,
          messages,
          lastMessage: messages[0],
          unreadCount: 0,
        })
      );
      
      return conversations.sort(
        (a, b) =>
          new Date(b.lastMessage.timestamp).getTime() -
          new Date(a.lastMessage.timestamp).getTime()
      );
    },
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (params: { to: string; message: string; threadId?: string }) => {
      const { data } = await api.post("/whatsapp/send", params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsappConversations"] });
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  return {
    conversations: data,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
}
