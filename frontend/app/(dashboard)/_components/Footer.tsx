"use client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useSystemStatus } from "@/helpers/hooks/useSystemStatus";
import { Skeleton } from "@/components/ui/skeleton";


export default function DashboardFooter({ user }) {
  const { data: status, isLoading } = useSystemStatus();
  console.log("sta", status)
  return (
    <footer className="border-t border-[#eeeeee] bg-white py-4 px-6 mt-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left: System info */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>System version:{status?.version}</span>
          <span>•</span>
          <span className="font-medium">Last Login: Today at 9:43 AM</span>
          {user && (
            <>
              <span>•</span>
              <span className="font-medium">Logged in as: {user.first_name} {user.last_name}</span>
            </>
          )}

          {/* ✅ System Status Indicator */}
          <span>•</span>
          {isLoading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <span className={`text-xs font-medium ${status?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
              System: {status?.status || "Unknown"}
            </span>
          )}
        </div>

        {/* Right: Actions + Copyright */}
        <div className="flex items-center gap-4">
          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-brand-gray hover:text-brand"
            onClick={() => {
              // Use NextAuth's signOut
              window.location.href = "/auth/logout"; // or use server action
            }}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>

          {/* Copyright */}
          <p className="text-sm text-gray-500">
            © 2025 KulanDesk. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}