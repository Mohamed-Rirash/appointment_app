import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { useState } from "react";

export function useEditOffice(token?: string) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const editOffice = async (
    officeId: string,
    data: { name: string; description: string; location: string }
  ) => {
    setLoading(true);
    try {
      const result = await client.editOffice(officeId, data, token);
      toast.success(result.message || "Office updated successfully");
      queryClient.invalidateQueries({ queryKey: ["offices"] });
      return true
    } catch (err: any) {
      toast.error(err.message || "Failed to update office");
    } finally {
      setLoading(false);
    }
  };

  return { editOffice, loading };
}
