"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAssignRole } from "@/hooks/useAssignRole";
import { useState } from "react";
import toast from "react-hot-toast";

const AVAILABLE_ROLES = ["admin", "host", "reception", "secretary"] as const;

export function AssignRoleModal({
  userId,
  currentRole,
  token,
}: {
  userId: string;
  currentRole: string;
  token: string;
}) {
  const { assignRole } = useAssignRole(token);
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const handleSubmit = async () => {
    if (selectedRole === currentRole) {
      toast.error("Please select a different role");
      return;
    }

    const success = await assignRole(userId, selectedRole);
    console.log("sssss", success);
    if (success) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer px-2 py-1.5 text-sm hover:bg-gray-100">
          Assign Role
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-40">
        <DialogHeader>
          <DialogTitle className="text-brand-black">
            Assign New Role
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <label className="text-[16px] text-brand-black font-medium">
              Select Role
            </label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="mt-2 py-6 rounded-[4px] text-[16px] w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-4 pt-2">
            <Button
              className="py-6 px-6 text-brand-gray hover:text-brand-gray rounded-[4px]  text-lg font-bold "
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="py-6 rounded-[4px] bg-gradient-to-r from-[#24C453] to-[#24C453] text-lg font-bold text-white hover:from-[#1fb048] hover:to-[#1fb048]"
              onClick={handleSubmit}
            >
              Assign Role
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
