// hooks/useOffices.ts
import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";

export function useOffices(token?: string) {
  const query = useQuery({
    queryKey: ["offices"],
    queryFn: async () => {
      if (!token) throw new Error("Unauthorized");
      const response = await client.getOffices(token);
      return response;
    },
    enabled: !!token,
  });

  return {
    ...query,
    offices: query.data || [],
  };
}
