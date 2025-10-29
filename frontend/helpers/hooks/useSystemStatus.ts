
import { useQuery } from "@tanstack/react-query";
export function useSystemStatus() {
  const query = useQuery({
    queryKey: ["system-status"],
    queryFn: async () => {
      const response = await fetch("/api/health");
      return response.json();
    },
    refetchInterval: 60 * 1000, // every 60 seconds
  });
  return query;
}