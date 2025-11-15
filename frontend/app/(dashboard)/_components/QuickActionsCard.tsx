"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateOfficeForm from "../admin/offices/_components/officeForm";
import UserForm from "../admin/members/_components/userForm";
import { PlusIcon } from "lucide-react";

export default function QuickActionsCard({ token }: { token?: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
      <h2 className="text-xl font-bold mb-1">Quick Actions</h2>
      <p className="text-sm text-gray-500 mb-4">
        Frequently used administrative tasks
      </p>

      <div className="flex gap-x-4 max-w-96 w-full">
        {/* Create User */}

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full rounded-[4px]  bg-linear-to-r from-[#29E05F] to-[#0F9938] text-white font-bold py-6 px-8 hover:from-[#3CEA6F] hover:to-[#15A940]">
              <span className="flex items-center gap-2">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Create User
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="p-6 max-w-md w-full">
            <DialogTitle className="text-2xl font-bold text-center">
              Create new user
            </DialogTitle>
            <DialogDescription></DialogDescription>
            <UserForm token={token} />
          </DialogContent>
        </Dialog>

        {/* office */}

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full font-bold py-6 px-8 rounded-[4px]"
            >
              <span className="flex items-center gap-2">
                <PlusIcon/>
                Create Office
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="p-6 ">
            <DialogTitle className="text-lg mb-0 font-bold text-center text-brand-black">
              Create New Office
            </DialogTitle>

            <DialogDescription className="text-[14px] max-w-[320px] w-full mx-auto text-center leading-[16px] text-brand-gray">
              Add the office’s name, description, and location to register it in
              the system
            </DialogDescription>
            <CreateOfficeForm token={token} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
