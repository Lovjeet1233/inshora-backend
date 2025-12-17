import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { handleApiError } from "@/lib/api";
import type { Campaign, Contact, ApiResponse } from "@/types";
import { toast } from "sonner";

export function useCampaigns(filters?: { status?: string; type?: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", filters],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Campaign[]>>("/campaigns", {
        params: filters,
      });
      return data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (campaign: Partial<Campaign>) => {
      const { data } = await api.post<ApiResponse<Campaign>>("/campaigns", campaign);
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created successfully!");
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  const startMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("🚀 Starting campaign:", id);
      const { data } = await api.post(`/campaigns/${id}/start`);
      console.log("✅ Campaign start response:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("✅ Campaign started successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign started!");
    },
    onError: async (error) => {
      console.error("❌ Campaign start error:", error);
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/campaigns/${id}/pause`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign paused!");
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  const uploadCSVMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<ApiResponse<{ contacts: Contact[] }>>(
        "/campaigns/upload-csv",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return data.data!.contacts;
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  return {
    campaigns: data,
    isLoading,
    createCampaign: createMutation.mutate,
    isCreating: createMutation.isPending,
    startCampaign: startMutation.mutate,
    pauseCampaign: pauseMutation.mutate,
    uploadCSV: uploadCSVMutation.mutateAsync,
    isUploadingCSV: uploadCSVMutation.isPending,
  };
}

export function useCampaign(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Campaign>>(`/campaigns/${id}`);
      return data.data!;
    },
    enabled: !!id,
  });

  return { campaign: data, isLoading };
}
