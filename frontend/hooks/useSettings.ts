import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { handleApiError } from "@/lib/api";
import type { Settings, ApiResponse } from "@/types";
import { toast } from "sonner";

export function useSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Settings>>("/settings");
      return data.data!;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<Settings>) => {
      const { data } = await api.put<ApiResponse<Settings>>("/settings", settings);
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings updated successfully!");
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  const testWhatsAppMutation = useMutation({
    mutationFn: async (credentials: { phoneNumberId: string; token: string }) => {
      const { data } = await api.post("/settings/test-whatsapp", credentials);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "WhatsApp connection successful!");
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  const testFacebookMutation = useMutation({
    mutationFn: async (credentials: { pageId: string; accessToken: string }) => {
      const { data } = await api.post("/settings/test-facebook", credentials);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Facebook connection successful!");
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  return {
    settings: data,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    testWhatsApp: testWhatsAppMutation.mutate,
    testingWhatsApp: testWhatsAppMutation.isPending,
    testFacebook: testFacebookMutation.mutate,
    testingFacebook: testFacebookMutation.isPending,
  };
}
