"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentActivityCard } from "./RecentActivityCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
export default function RecentActivitySection({ token }: { token?: string }) {
  //   const { data, isLoading } = useQuery({
  //     queryKey: ["recent-activity"],
  //     queryFn: async () => {
  //       if (!token) throw new Error("Unauthorized");
  //       const response = await client.getRecentActivity(token);
  //       return response.activities || [];
  //     },
  //     placeholderData: (previousData) => previousData,
  //   });

  const [isLoading, setIsLoading] = useState(false);

  const data = [
    {
      id: "1",
      type: "office",
      title: "Office Updated",
      description: "location have changed",
      actor: "Admin",
      time: "5 minute",
    },
    {
      id: "2",
      type: "user",
      title: "User created",
      description: "New reception account created",
      actor: "Admin",
      time: "12 minute",
    },
  ];

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
        <h2 className="text-xl font-bold mb-1">Recent Users</h2>
        <p className="text-sm text-gray-500 mb-4">
          Latest user account and status
        </p>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Recent Users</h2>
          <p className="text-sm text-gray-500">
            Latest user account and status
          </p>
        </div>
        {/* <Button variant="outline" className="text-brand-gray">
          View All Activity
        </Button> */}
      </div>
      <div className="space-y-4">
        {data.map((activity) => (
          <RecentActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}
