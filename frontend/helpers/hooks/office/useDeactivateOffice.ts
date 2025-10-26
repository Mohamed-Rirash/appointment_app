"use client";

import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";
import { useState } from "react";

export function useDeactivateOffice(token?: string) {
  const queryClient = useQueryClient();
  const [isdeActivating, setIsdeActivating] = useState(false)

  const deactivateOffice = async (officeId: string) => {
    if (!token) {
      toast.error("Unauthorized");
      return false;
    }

    try {
        setIsdeActivating(true)
      const result = await client.deactivateOffice(officeId, token);
      toast.success(result.message || "Office deactivated successfully");
      queryClient.invalidateQueries({ queryKey: ["offices"] });
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate office");
      return false;
    } finally{
        setIsdeActivating(false)
    }
  };

  return { deactivateOffice , isdeActivating};
}