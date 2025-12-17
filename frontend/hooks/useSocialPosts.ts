import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { handleApiError } from "@/lib/api";
import type { SocialMediaPost, GeneratedImages, ApiResponse, FacebookTokenInfo } from "@/types";
import { toast } from "sonner";

export function useSocialPosts() {
  const queryClient = useQueryClient();

  // Validate Facebook token
  const { data: tokenInfo, isLoading: isValidatingToken, refetch: revalidateToken } = useQuery({
    queryKey: ["facebookToken"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacebookTokenInfo>>("/social/validate-token");
      return data.data || null;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const { data, isLoading } = useQuery({
    queryKey: ["socialPosts"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SocialMediaPost[]>>("/social/posts");
      return data.data || [];
    },
  });

  const generateImagesMutation = useMutation({
    mutationFn: async (params: { idea: string; style?: string; platform?: string }) => {
      const { data } = await api.post<ApiResponse<GeneratedImages>>(
        "/social/generate-images",
        params
      );
      return data.data!;
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  const postToFacebookMutation = useMutation({
    mutationFn: async (params: { imageUrl: string; caption: string }) => {
      const { data } = await api.post("/social/post-to-facebook", params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialPosts"] });
      toast.success("Posted to Facebook successfully!");
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, caption }: { postId: string; caption: string }) => {
      const { data } = await api.put(`/social/post/${postId}`, { caption });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialPosts"] });
      toast.success("Post updated successfully!");
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.delete(`/social/post/${postId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialPosts"] });
      toast.success("Post deleted successfully!");
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  const refreshInsightsMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.get(`/social/post/${postId}/insights`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialPosts"] });
      toast.success("Insights refreshed!");
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  return {
    posts: data,
    isLoading,
    tokenInfo,
    isValidatingToken,
    revalidateToken,
    generateImages: generateImagesMutation.mutateAsync,
    isGenerating: generateImagesMutation.isPending,
    postToFacebook: postToFacebookMutation.mutate,
    isPosting: postToFacebookMutation.isPending,
    updatePost: updatePostMutation.mutate,
    deletePost: deletePostMutation.mutate,
    refreshInsights: refreshInsightsMutation.mutate,
  };
}
