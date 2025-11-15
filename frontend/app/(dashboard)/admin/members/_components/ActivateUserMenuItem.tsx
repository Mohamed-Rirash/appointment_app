"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useActivateUser } from "@/helpers/hooks/useActivateUser";

export function ActivateUserMenuItem({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) {
  const { activateUser } = useActivateUser(token);

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        activateUser(userId);
      }}
      className="cursor-pointer"
    >
      Activate user
    </DropdownMenuItem>
  );
}
