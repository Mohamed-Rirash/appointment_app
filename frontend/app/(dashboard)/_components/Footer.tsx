"use client";

import type { UserSession } from "@/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemStatus } from "@/helpers/hooks/useSystemStatus";
import {
  Shield,
  User,
  Clock,
  Cpu,
  Heart,
  AlertCircle,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardFooter({ user }: { user: UserSession }) {
  const { data: status, isLoading } = useSystemStatus();

  // Format last login time
  const formatLastLogin = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
        return {
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          icon: CheckCircle2,
          label: "Operational"
        };
      case "degraded":
        return {
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          icon: AlertCircle,
          label: "Degraded"
        };
      case "unhealthy":
        return {
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          icon: AlertCircle,
          label: "Unhealthy"
        };
      default:
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          icon: Cpu,
          label: "Unknown"
        };
    }
  };

  const statusConfig = getStatusConfig(status?.status);

  return (
    <footer className="border-t border-gray-200 bg-linear-to-r from-white to-gray-50/50 backdrop-blur-sm py-6 px-8 mt-12">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        {/* Left: System Information */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
          {/* System Version */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Cpu className="h-4 w-4 text-blue-500" />
            <span className="font-medium">v{status?.version || "1.0.0"}</span>
          </div>

          {/* Last Login */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-purple-500" />
            <span className="font-medium">Last: {formatLastLogin()}</span>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4 text-green-500" />
              <span className="font-medium">{user.first_name} {user.last_name}</span>
            </div>
          )}

          {/* System Status */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ) : (
              <Badge
                variant="outline"
                className={`${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} font-medium px-3 py-1.5 text-xs`}
              >
                <statusConfig.icon className="h-3 w-3 mr-1.5" />
                System: {statusConfig.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Right: Copyright and Additional Info */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
          {/* Additional Status Info */}
          {status?.response_time && (
            <div className="flex items-center gap-2 text-gray-500">
              <Heart className="h-3 w-3 text-green-500" />
              <span>{status.response_time}ms</span>
            </div>
          )}

          {/* Copyright */}
          <div className="flex items-center gap-2 text-gray-500">
            <Shield className="h-4 w-4 text-gray-400" />
            <span>© 2025 KulanDesk</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">All rights reserved</span>
          </div>
        </div>
      </div>

      {/* Bottom Row for Mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-gray-100 sm:hidden">
        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>Secure Connection</span>
          <span>•</span>
          <span>Encrypted</span>
        </div>

        <div className="text-xs text-gray-400">
          <Calendar className="h-3 w-3 inline mr-1" />
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </div>
    </footer>
  );
}