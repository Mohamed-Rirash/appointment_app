"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useResendInvite } from "@/hooks/useResendInvite";

export function ResendInviteMenuItem({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) {
  const { resendInvite } = useResendInvite(token);

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        resendInvite(userId);
      }}
      className="text-green-600 cursor-pointer"
    >
      Resend invite
    </DropdownMenuItem>
  );
}
