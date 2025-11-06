import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";

export interface OfficeMember {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_active: boolean;
  membership_id: string;
  position: string;
  is_primary: boolean;
  membership_active: boolean;
}

export function useOfficeMembers(officeId: string, token?: string) {
  const query = useQuery({
    queryKey: ["office-members", officeId],
    queryFn: async () => {
      if (!token) throw new Error("Unauthorized");
      const data = await client.getOfficeMembers(officeId, token);
      return data as OfficeMember[];
    },
    enabled: !!officeId && !!token,
  });

  return {
    ...query,
    memberCount: query.data?.length || 0,
    members: query.data || [],
  };
}
