import { useState } from "react";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

export function useDeleteUser(token?: string) {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const deleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      const result = await client.deleteUser(userId, token);

      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["users"] });
        return result.success;
      } else {
        toast.error(result.message || "Failed to delete user");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteUser, isDeleting };
}
