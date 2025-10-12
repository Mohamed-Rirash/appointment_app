// components/UsersStatsCard.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { useUserStats } from "@/hooks/useUserStats";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersStatsCard({ token }: { token?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["users-full"],
    queryFn: async () => {
      if (!token) throw new Error("Unauthorized");
      // Fetch all users (or first page if paginated)
      const response = await client.getUsers(token, 1, 100); // adjust size as needed
      return response.appointments; // your API uses "appointments" key
    },
  });
  console.log("data", data);

  const stats = useUserStats(data || []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Users */}
      <StatCard title="Total Users" value={stats.total} icon="👥" />

      {/* User Status */}
      <StatCard
        title="User Status"
        value={`${stats.active} active • ${stats.inactive} inactive`}
        icon="🟢🔴"
      />

      {/* Verification Status (Recommended Third Card) */}
      <StatCard
        title="Verification Status"
        value={`${stats.verified} verified • ${stats.unverified} unverified`}
        icon="✅⚪"
      />
    </div>
  );
}

// Reusable Stat Card
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-gren border border-[#eeeeee]">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="font-bold text-lg">{value}</div>
    </div>
  );
}
