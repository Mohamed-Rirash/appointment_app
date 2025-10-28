"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

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
        icon={<UserIcon />}
        subtitle={
          <span className="text-green-600 text-xs font-medium">All Online</span>
        }
      />

      {/* Total Offices */}
      <StatCard
        title="Total Offices"
        value={total_offices}
        icon={<OfficeIcon />}
        subtitle={
          <span className="text-green-600 text-xs font-medium">All Online</span>
        }
      />

      {/* All Status */}
      <StatCard
        title="All Status"
        value=""
        icon={<StatusIcon />}
        content={
          <div className="flex gap-2">
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
        icon={<CheckIcon />}
        content={
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              {verified_users} active
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              {unverified_users} in active
            </span>
          </div>
        }
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
    <div className="bg-white p-4 rounded-lg shadow-gren border border-[#eeeeee] flex items-center gap-4">
      <div className="bg-green-100 p-3 rounded-lg">{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        {value && <div className="text-xl font-bold">{value}</div>}
        {subtitle && <div>{subtitle}</div>}
        {content && <div>{content}</div>}
      </div>
    </div>
  );
}

// Icons
function UserIcon() {
  return (
    <svg
      className="h-6 w-6 text-green-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h-8v-2c0-2.21 1.79-4 4-4s4 1.79 4 4v2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2M5 8V6m0 2v6m0 0v6h14v-6m0 6a2 2 0 002-2H5a2 2 0 002 2z"
      />
    </svg>
  );
}

function OfficeIcon() {
  return (
    <svg
      className="h-6 w-6 text-green-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0v-2a2 2 0 00-2-2H9M9 19v2a2 2 0 002 2h2a2 2 0 002-2v-2"
      />
    </svg>
  );
}

function StatusIcon() {
  return (
    <svg
      className="h-6 w-6 text-yellow-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-6 w-6 text-yellow-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 6v-2a3 3 0 00-5.356-2.357A24.5 24.5 0 00 12 12c1.357 0 2.693.055 4 .162"
      />
    </svg>
  );
}
