import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { handleApiError } from "@/lib/api";
import type { ApiResponse } from "@/types";
import { toast } from "sonner";

export interface IngestedData {
  _id: string;
  collection: string;
  type: "url" | "pdf" | "csv";
  source: string;
  filename?: string;
  url?: string;
  ingestedAt: string;
  status: "success" | "failed";
  error?: string;
}

export interface IngestResponse {
  message: string;
  collection: string;
  sources: string[];
}

export function useInbound() {
  const queryClient = useQueryClient();

  // Fetch all ingested data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ingestedData"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<IngestedData[]>>("/inbound/list");
      return data.data || [];
    },
  });

  // Ingest data mutation
  const ingestMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post<ApiResponse<IngestResponse>>(
        "/inbound/ingest",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return data.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ingestedData"] });
      toast.success(`Successfully ingested data into ${data.collection}`);
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  return {
    ingestedData: data,
    isLoading,
    refetch,
    ingestData: ingestMutation.mutateAsync,
    isIngesting: ingestMutation.isPending,
  };
}

