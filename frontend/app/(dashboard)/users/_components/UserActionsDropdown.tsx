// components/UserActionsDropdown.tsx
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { ResendInviteMenuItem } from "./ResendInviteMenuItem";

// import { ActivateUserMenuItem } from "./ActivateUserMenuItem";
// import { DeactivateUserMenuItem } from "./DeactivateUserMenuItem";
// import { SuspendUserMenuItem } from "./SuspendUserMenuItem";
// import Assign/Revoke if needed

export function UserActionsDropdown({
  userId,
  email,
  token,
  currentRole,
}: {
  userId: string;
  email: string;
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
        className="w-48 p-0 border border-[#eeeeee] rounded-md shadow-lg"
      >
        <ResendInviteMenuItem userId={userId} token={token} />
        {/* <ActivateUserMenuItem userId={userId} token={token} />
        <DeactivateUserMenuItem userId={userId} token={token} />
        <SuspendUserMenuItem userId={userId} token={token} /> */}
        {/* 
        <AssignRoleMenuItem userId={userId} token={token} currentRole={currentRole} />
        <RevokeRoleMenuItem userId={userId} token={token} roleName={currentRole} />
        */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
