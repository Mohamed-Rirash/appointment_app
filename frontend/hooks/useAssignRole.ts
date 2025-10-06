import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";

export function useAssignRole(token: string) {
  const queryClient = useQueryClient();

  const assignRole = async (userId: string, roleName: string) => {
    try {
      const result = await client.assignRole(userId, roleName, token);
      toast.success(result.message || "Role assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to assign role");
      return false;
    }
  };

  return { assignRole };
}
