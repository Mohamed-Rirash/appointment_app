import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { useState } from "react";

export function useDeactivateUser(token: string) {
  const [isdeactivating, setIsdeactivating] = useState(false);
  const queryClient = useQueryClient();

  const deactivateUser = async (userId: string) => {
    // if (!confirm("Are you sure you want to deactivate this user?")) return;
    setIsdeactivating(true);
    try {
      const result = await client.deactivateUser(userId, token);
      toast.success(result.message || "User deactivated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate user");
    } finally {
      setIsdeactivating(false);
    }
  };

  return { deactivateUser, isdeactivating };
}
