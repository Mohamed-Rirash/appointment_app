import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import toast from "react-hot-toast";

export function useResendInvite(token: string) {
  const queryClient = useQueryClient();

  const resendInvite = async (userId: string) => {
    try {
      console.log("userId::", userId);
      const result = await client.resendInvite(userId, token);
      toast.success(result.message || "Invite resent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend invite");
    }
  };

  return { resendInvite };
}
