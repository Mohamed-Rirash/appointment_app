"use client";

import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { useState } from "react";

export function useDeleteOffice(token?: string) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteOffice = async (officeId: string) => {
    try {
        setIsDeleting(true)
      const result = await client.deleteOffice(officeId, token);
      toast.success(result.message || "Office deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["offices"] });
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to delete office");
      return false;
    } finally{
        setIsDeleting(false)
    }
  };

  return { deleteOffice , isDeleting};
}