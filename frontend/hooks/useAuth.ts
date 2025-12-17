import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api, { handleApiError } from "@/lib/api";
import type { AuthResponse } from "@/types";
import { toast } from "sonner";

export function useAuth() {
  const router = useRouter();
  const { setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await api.post<AuthResponse>("/auth/login", credentials);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success("Login successful!");
      router.push("/dashboard");
    },
    onError: async (error) => {
      const message = await handleApiError(error);
      toast.error(message);
    },
  });

  const logout = () => {
    clearAuth();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return {
    login: loginMutation.mutate,
    isLoading: loginMutation.isPending,
    logout,
  };
}
