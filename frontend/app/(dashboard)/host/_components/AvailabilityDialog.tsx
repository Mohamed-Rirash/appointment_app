"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import ViewAvailabilityDialog from "./ViewAvailabilityDialog";

export function AvailabilityDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl! w-full bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-brand-black">Availability Time</DialogTitle>
          <p className="text-sm text-brand-gray">View your weekly availability</p>
        </DialogHeader>
        <div className="py-4">
          <ViewAvailabilityDialog officeId={"kjlkakdfkasdkf"} userId="user-id-here" />
        </div>
      </DialogContent>
    </Dialog>
  );
}