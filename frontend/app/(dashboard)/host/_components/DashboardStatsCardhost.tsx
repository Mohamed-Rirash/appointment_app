"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { CircleAlert, HousePlus, Users } from "lucide-react";

export interface Stats {
  total_users: number;
  total_offices: number;
  active_offices: number;
  inactive_offices: number;
  verified_users: number;
  unverified_users: number;
}

export default function DashboardStatsCard({ token }: { token?: string }) {
  //   const { data, isLoading } = useQuery<Stats>({
  //     queryKey: ["dashboard-stats"],
  //     queryFn: async () => {
  //       if (!token) throw new Error("Unauthorized");
  //       const response = await client.getDashboardStats(token);
  //       return response;
  //     },
  //     placeholderData: (previousData) => previousData,
  //   });
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }
  let data = {
    total_users: 123,
    total_offices: 80,
    active_offices: 12,
    inactive_offices: 8,
    verified_users: 12,
    unverified_users: 8,
  };
  //   const {
  //     total_users,
  //     total_offices,
  //     active_offices,
  //     inactive_offices,
  //     verified_users,
  //     unverified_users,
  //   } = data || {};

  const {
    total_users,
    total_offices,
    active_offices,
    inactive_offices,
    verified_users,
    unverified_users,
  } = data || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users */}
      <StatCard
        title="Total Users"
        value={total_users}
        icon={<Users className="h-6 w-6 text-brand-black" />}
        subtitle={
          <span className="text-green-600 text-xs font-medium">All Online</span>
        }
      />

      {/* Total Offices */}
      <StatCard
        title="Total Offices"
        value={total_offices}
        icon={<HousePlus className="h-6 w-6 text-brand-black" />}
        subtitle={
          <span className="text-green-600 text-xs font-medium">All Online</span>
        }
      />

      {/* All Status */}
      <StatCard
        title="All Status"
        value=""
        icon={<CircleAlert className="h-6 w-6 text-[#F2B749]" />}
        content={
          <div className="flex mt-4 gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              {active_offices} active
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              {inactive_offices} in active
            </span>
          </div>
        }
      />

      {/* Verification Status */}
      <StatCard
        title="Verification Status"
        value=""
        content={
          <div className="flex mt-4 gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              {verified_users} active
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              {unverified_users} in active
            </span>
          </div>
        }
        icon={<CircleAlert className="h-6 w-6 text-[#F2B749]" />}
      />
    </div>
  );
}

// Reusable Stat Card
function StatCard({
  title,
  value,
  icon,
  subtitle,
  content,
}: {
  title: string;
  value?: number | string;
  icon: React.ReactNode;
  subtitle?: React.ReactNode;
  content?: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-[4px] h-[120px] shadow-gren border border-[#eeeeee] flex items-center justify-between">
      <div>
        <h1 className="text-sm text-brand-gray font-normal">{title}</h1>
        {value && <div className="text-xl font-bold">{value}</div>}
        {subtitle && <div>{subtitle}</div>}
        {content && <div>{content}</div>}
      </div>
      <div
        className={`${
          content ? "bg-[#F3ECE0]" : "bg-brand-primary"
        } h-12 w-12 p-3 rounded-lg`}
      >
        {icon}
      </div>
    </div>
  );
}
