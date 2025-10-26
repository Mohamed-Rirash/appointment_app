// hooks/useActivateUser.ts
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";

export function useActivateUser(token: string) {
  const queryClient = useQueryClient();

  const activateUser = async (userId: string) => {
    try {
      const result = await client.activateUser(userId, token);
      toast.success(result.message || "User activated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to activate user");
    }
  };

  return { activateUser };
}
