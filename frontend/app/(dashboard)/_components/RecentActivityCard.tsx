"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
export interface Activity {
  id: string;
  type: "office" | "user";
  title: string;
  description: string;
  actor: string;
  time: string;
}
export function RecentActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="p-4 border-b border-[#eeeeee] flex items-start gap-3">
      {/* Icon */}
      <div className="bg-green-100 p-2 rounded-lg">
        {activity.type === "office" ? (
          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0v-2a2 2 0 00-2-2H9M9 19v2a2 2 0 002 2h2a2 2 0 002-2v-2" />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h-8v-2c0-2.21 1.79-4 4-4s4 1.79 4 4v2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2M5 8V6m0 2v6m0 0v6h14v-6m0 6a2 2 0 002-2H5a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      {/* Content */}
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold">{activity.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
            <p className="text-xs text-gray-500 mt-1">by {activity.actor}</p>
          </div>
          <span className="text-xs text-gray-500">{activity.time}</span>
        </div>
      </div>
      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 p-2">
          <DropdownMenuItem className="cursor-pointer">View</DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">Edit</DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}