"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRevokeRole } from "@/helpers/hooks/useRevokeRole";


export function RevokeRoleMenuItem({
  userId,
  roleName,
  token,
}: {
  userId: string;
  roleName: string;
  token: string;
}) {
  const { revokeRole, isrevoking } = useRevokeRole(token);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 text-sm w-full justify-start"
          disabled={isrevoking}
        >
          Revoke role
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Revoke “{roleName}” role from this user?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the <strong>{roleName}</strong> role from the user.
            They will immediately lose all permissions associated with this
            role. You can assign the role again later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isrevoking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => revokeRole(userId, roleName)}
            disabled={isrevoking}
            className="bg-red-600 hover:bg-red-700"
          >
            {isrevoking ? "Revoking..." : "Yes, revoke role"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
