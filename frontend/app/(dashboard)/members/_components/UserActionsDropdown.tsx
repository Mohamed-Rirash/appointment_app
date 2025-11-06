"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { ResendInviteMenuItem } from "./ResendInviteMenuItem";
import { ActivateUserMenuItem } from "./ActivateUserMenuItem";

export function UserActionsDropdown({
  userId,
  token,
  currentRole,
}: {
  userId: string;
  token: string;
  currentRole: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 p-2 font-medium border border-[#eeeeee] rounded-md shadow-lg"
      >
        <ResendInviteMenuItem userId={userId} token={token} />
        <ActivateUserMenuItem userId={userId} token={token} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
