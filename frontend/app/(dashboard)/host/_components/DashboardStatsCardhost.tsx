// "use client";

// import { useQuery } from "@tanstack/react-query";
// import { client } from "@/helpers/api/client";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useState } from "react";
// import { CircleAlert, HousePlus, Users } from "lucide-react";

// export interface Stats {
//   total_users: number;
//   total_offices: number;
//   active_offices: number;
//   inactive_offices: number;
//   verified_users: number;
//   unverified_users: number;
// }

// export default function DashboardStatsCard({ token }: { token?: string }) {
//   //   const { data, isLoading } = useQuery<Stats>({
//   //     queryKey: ["dashboard-stats"],
//   //     queryFn: async () => {
//   //       if (!token) throw new Error("Unauthorized");
//   //       const response = await client.getDashboardStats(token);
//   //       return response;
//   //     },
//   //     placeholderData: (previousData) => previousData,
//   //   });
//   const [isLoading, setIsLoading] = useState(false);

//   if (isLoading) {
//     return (
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {[...Array(4)].map((_, i) => (
//           <Skeleton key={i} className="h-24 rounded-lg" />
//         ))}
//       </div>
//     );
//   }
//   let data = {
//     total_users: 123,
//     total_offices: 80,
//     active_offices: 12,
//     inactive_offices: 8,
//     verified_users: 12,
//     unverified_users: 8,
//   };
//   //   const {
//   //     total_users,
//   //     total_offices,
//   //     active_offices,
//   //     inactive_offices,
//   //     verified_users,
//   //     unverified_users,
//   //   } = data || {};

//   const {
//     total_users,
//     total_offices,
//     active_offices,
//     inactive_offices,
//     verified_users,
//     unverified_users,
//   } = data || {};

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//       {/* Total Users */}
//       <StatCard
//         title="Total Users"
//         value={total_users}
//         icon={<Users className="h-6 w-6 text-brand-black" />}
//         subtitle={
//           <span className="text-green-600 text-xs font-medium">All Online</span>
//         }
//       />

//       {/* Total Offices */}
//       <StatCard
//         title="Total Offices"
//         value={total_offices}
//         icon={<HousePlus className="h-6 w-6 text-brand-black" />}
//         subtitle={
//           <span className="text-green-600 text-xs font-medium">All Online</span>
//         }
//       />

//       {/* All Status */}
//       <StatCard
//         title="All Status"
//         value=""
//         icon={<CircleAlert className="h-6 w-6 text-[#F2B749]" />}
//         content={
//           <div className="flex mt-4 gap-2">
//             <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
//               {active_offices} active
//             </span>
//             <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
//               {inactive_offices} in active
//             </span>
//           </div>
//         }
//       />

//       {/* Verification Status */}
//       <StatCard
//         title="Verification Status"
//         value=""
//         content={
//           <div className="flex mt-4 gap-2">
//             <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
//               {verified_users} active
//             </span>
//             <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
//               {unverified_users} in active
//             </span>
//           </div>
//         }
//         icon={<CircleAlert className="h-6 w-6 text-[#F2B749]" />}
//       />
//     </div>
//   );
// }

// // Reusable Stat Card
// function StatCard({
//   title,
//   value,
//   icon,
//   subtitle,
//   content,
// }: {
//   title: string;
//   value?: number | string;
//   icon: React.ReactNode;
//   subtitle?: React.ReactNode;
//   content?: React.ReactNode;
// }) {
//   return (
//     <div className="bg-white p-6 rounded-[4px] h-[120px] shadow-gren border border-[#eeeeee] flex items-center justify-between">
//       <div>
//         <h1 className="text-sm text-brand-gray font-normal">{title}</h1>
//         {value && <div className="text-xl font-bold">{value}</div>}
//         {subtitle && <div>{subtitle}</div>}
//         {content && <div>{content}</div>}
//       </div>
//       <div
//         className={`${
//           content ? "bg-[#F3ECE0]" : "bg-brand-primary"
//         } h-12 w-12 p-3 rounded-lg`}
//       >
//         {icon}
//       </div>
//     </div>
//   );
// // app/dashboard/components/HostDashboardCards.tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function HostDashboardCards({ token }: { token?: string }) {
  // const { data, isLoading } = useQuery({
  //   queryKey: ["host-dashboard-stats"],
  //   queryFn: async () => {
  //     if (!token) throw new Error("Unauthorized");
  //     const response = await client.getHostDashboardStats(token);
  //     return response;
  //   },
  //   placeholderData: (previousData) => previousData,
  // });

  const [isLoading, setIsLoading] = useState(false);

  let data = {
    total_appointments: 100,
    pending_decisions: 20,
    completed_today: 10,
    postponed: 5,
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  const {
    total_appointments,
    pending_decisions,
    completed_today,
    postponed,
  } = data || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Appointments */}
      <StatCard
        title="Total Appointments"
        value={total_appointments}
        icon={<TotalAppointmentsIcon />}
        bgColor="bg-[#E7FEEE]"
      />
      {/* Pending Decisions */}
      <StatCard
        title="Pending Decisions"
        value={pending_decisions}
        icon={<PendingDecisionsIcon />}
        bgColor="bg-[#FFF5E6]"
      />
      {/* Completed Today */}
      <StatCard
        title="Completed Today"
        value={completed_today}
        icon={<CompletedTodayIcon />}
        bgColor="bg-[#E7FEEE]"
      />
      {/* Postpone */}
      <StatCard
        title="Postpone"
        value={postponed}
        icon={<PostponeIcon />}
        bgColor="bg-[#E7FEEE]"
      />
    </div>
  );
}

// Reusable Stat Card
function StatCard({
  title,
  value,
  icon,
  bgColor,
}: {
  title: string;
  value?: number | string;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <div className={`p-4 rounded-lg shadow-gren border border-[#eeeeee] ${bgColor}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
        <div className={`p-3 rounded-lg ${bgColor === "bg-[#E7FEEE]" ? "text-green-600" : "text-yellow-600"}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Icons
function TotalAppointmentsIcon() {
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 4v16m8-8H4" />
    </svg>
  );
}

function PendingDecisionsIcon() {
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 12l2 2 4-4m6 6v-2a3 3 0 00-5.356-2.357A24.5 24.5 0 00 12 12c1.357 0 2.693.055 4 .162" />
    </svg>
  );
}

function CompletedTodayIcon() {
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 4v16m8-8H4" />
    </svg>
  );
}

function PostponeIcon() {
  return (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 4v16m8-8H4" />
    </svg>
  );
}