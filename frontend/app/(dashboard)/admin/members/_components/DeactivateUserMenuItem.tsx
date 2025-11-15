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
import { useDeactivateUser } from "@/helpers/hooks/useDeactivateUser";


export function DeactivateUserMenuItem({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) {
  const { deactivateUser, isdeactivating } = useDeactivateUser(token);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 text-sm"
          disabled={isdeactivating}
        >
          Deactivate this user?
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will deactivate the user, preventing them from accessing the
            system. You can reactivate the user later if needed
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isdeactivating}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deactivateUser(userId)}
            disabled={isdeactivating}
            className="bg-red-600 hover:bg-red-700"
          >
            {isdeactivating ? "Deactivating..." : "Yes, deactivate user"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
