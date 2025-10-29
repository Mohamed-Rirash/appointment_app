"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { OfficeOverviewCard } from "./OfficeOverviewCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OfficeOverviewSection({ token }: { token?: string }) {
//   const { data, isLoading } = useQuery({
//     queryKey: ["office-overview"],
//     queryFn: async () => {
//       if (!token) throw new Error("Unauthorized");
//       const response = await client.getOfficeOverview(token);
//       return response.offices || [];
//     },
//     placeholderData: (previousData) => previousData,
//   });

const [isLoading, setIsLoading] = useState(false)

 const data = [
  {
    id: "1",
    name: "New York Headquarters",
    location: "Manhattan, NY",
    member_count: 24,
    is_active: true
  },
  {
    id: "2",
    name: "London Office",
    location: "Westminster, London",
    member_count: 18,
    is_active: true
  },
  {
    id: "3",
    name: "Tokyo Branch",
    location: "Shibuya, Tokyo",
    member_count: 12,
    is_active: true
  },
  {
    id: "4",
    name: "Sydney Office",
    location: "Sydney, NSW",
    member_count: 8,
    is_active: false
  },
  {
    id: "5",
    name: "Berlin Hub",
    location: "Mitte, Berlin",
    member_count: 15,
    is_active: true
  },
  {
    id: "6",
    name: "Singapore Office",
    location: "Marina Bay, Singapore",
    member_count: 10,
    is_active: true
  },
  {
    id: "7",
    name: "Toronto Branch",
    location: "Downtown Toronto",
    member_count: 6,
    is_active: false
  },
  {
    id: "8",
    name: "Paris Office",
    location: "Champs-Élysées, Paris",
    member_count: 14,
    is_active: true
  }
];


  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
        <h2 className="text-xl font-bold mb-1">Office Overview</h2>
        <p className="text-sm text-gray-500 mb-4">Quick view of active offices and statistics</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-gren border border-[#eeeeee]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Office Overview</h2>
          <p className="text-sm text-gray-500">Quick view of active offices and statistics</p>
        </div>
        <Link href={"/offices"}>
         <Button variant="outline" className="text-brand-gray">
          View All Offices
        </Button>
        </Link>
       
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map((office) => (
          <OfficeOverviewCard key={office.id} office={office} />
        ))}
      </div>
    </div>
  );
}