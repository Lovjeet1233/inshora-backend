import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DashboardAnalytics, ApiResponse } from "@/types";

export function useAnalytics(dateRange?: { startDate?: string; endDate?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", dateRange],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DashboardAnalytics>>(
        "/analytics/dashboard",
        {
          params: dateRange,
        }
      );
      return data.data!;
    },
  });

  return {
    analytics: data,
    isLoading,
  };
}
