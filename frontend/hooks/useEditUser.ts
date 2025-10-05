"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";

interface EditUserData {
  first_name: string;
  last_name: string;
  email: string;
}

export function useEditUser(token: string) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateUser = async (userId: string, data: EditUserData) => {
    setIsUpdating(true);
    try {
      const result = await client.updateUser(userId, data, token);
      console.log("r", result);
      toast.success(result.message || "User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      return true;
    } catch (err: any) {
      console.log("er", err);
      toast.error(err.message || "Failed to update user");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateUser, isUpdating };
}
