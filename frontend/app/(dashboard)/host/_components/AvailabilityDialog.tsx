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

export function AvailabilityDialog({
  children,
  title = "Manage Availability",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {/* Placeholder content — replace with actual availability/calendar UI */}
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <Clock className="h-5 w-5" />
            <span>Set your available hours</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-5 w-5" />
            <span>View your calendar</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}