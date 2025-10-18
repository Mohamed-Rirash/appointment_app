"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useOffices } from "@/hooks/office/useOffices";

export interface Office {
  id: string;
  name: string;
  description: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function OfficeCard({ token }: { token?: string }) {
  const { offices, isLoading } = useOffices(token) as {
    offices: Office[];
    isLoading: boolean;
  };
  console.log("offices", offices);

  if (isLoading) {
    return <div>Loading offices...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
      {offices.length === 0 ? (
        <div className="col-span-full bg-red-200 w-full">
          <p className="text-center text-lg py-12 text-brand-gray">
            No offices found.
          </p>
        </div>
      ) : (
        offices.map((office) => (
          <Link
            key={office.id}
            href={`/offices/${office.id}`}
            className="block"
          >
            <div className="border border-[#eeeeee] rounded-[4px] shadow-gren p-6 cursor-pointer hover:shadow-md transition-shadow h-full">
              <h1 className="text-2xl font-bold text-brand-black">
                {office.name}
              </h1>
              <p className="text-lg text-brand-gray leading-[20px] mt-1 mb-2">
                {office.description}
              </p>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1 text-[14px] text-brand-gray font-normal">
                  <MapPin className="h-4 w-4" />
                  {office.location}
                </span>
                <Badge
                  className={`
                    py-2
                    px-4 rounded-full font-bold
                    ${
                      office.is_active
                        ? "bg-brand-primary text-brand"
                        : "bg-[#FDE7E7] text-[#F00F0F]"
                    }
                  `}
                >
                  {office.is_active ? "active" : "inactive"}
                </Badge>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
