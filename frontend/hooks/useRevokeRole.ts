import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { useState } from "react";

export function useRevokeRole(token: string) {
  const [isrevoking, setIsrevoking] = useState(false);
  const queryClient = useQueryClient();

  const revokeRole = async (userId: string, roleName: string) => {
    setIsrevoking(true);
    try {
      console.log("role", roleName);
      console.log("role", userId);
      const result = await client.revokeRole(userId, roleName, token);
      toast.success(result.message || "Role revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke role");
    } finally {
      setIsrevoking(false);
    }
  };

  return { revokeRole, isrevoking };
}
