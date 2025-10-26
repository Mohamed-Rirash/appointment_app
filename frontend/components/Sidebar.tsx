"use client";

import { Button } from "@/components/ui/button";
import {
  Building,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  LayoutDashboard,
  PlusCircle,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const toggleSidebar = () => setOpen((prev) => !prev);

  const items = [
    { label: "Dashboard", url: "/", icon: LayoutDashboard },
    { label: "Members", url: "/members", icon: UsersIcon },
    { label: "Office management", url: "/offices", icon: Building },
    { label: "Add appointment", url: "/appointments/add", icon: PlusCircle },
    { label: "View appointment", url: "/appointments", icon: Eye },
  ];

  return (
    <div className="flex h-screen">
      {/* Main Sidebar */}
      <aside
        className={`bg-white border-r border-brand-secondary  transition-all duration-300 ease-in-out flex flex-col ${
          open ? "w-60 px-4" : "w-16 px-0"
        }`}
      >
        {/* Header with Logo and Toggle */}
        <div
          className={`flex items-center ${open ? "justify-between" : "justify-center"} py-8 bg-yellow-0 border-b border-[#eeeeee]`}
        >
          {open && (
            <div className="flex items-center space-x-2">
              {/* Replace with your actual logo */}
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                RH
              </div>
              <span className="font-bold text-sm">Royal Henna</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={`${open ? "" : "w-full"}`}
          >
            {open ? (
              <ChevronsLeft className="h-5! w-5! text-brand-black" />
            ) : (
              <ChevronsRight className="h-7! w-7! text-brand-black" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-8 space-y-2">
          {items.map((item, index) => {
            const isActive = pathname === item.url;
            return (
              <div key={index} className="group relative">
                <Button
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    open ? "" : "justify-center"
                  } rounded-[4px] py-6 hover:bg-brand-primary transition-all duration-200 font-normal ${
                    isActive
                      ? "bg-brand-primary text-brand-black font-bold"
                      : "text-brand-gray hover:bg-brand-primary hover:text-brand-black hover:font-medium"
                  }`}
                >
                  <Link href={item.url} className="text-[16px]  ">
                    <item.icon
                      className={`h-6! w-6! ${open ? "mr-2" : "h-7! w-7!"}`}
                    />
                    <span> {open && item.label} </span>
                  </Link>
                </Button>

                {/* Tooltip for collapsed state */}
                {!open && (
                  <div
                    className={`
                    absolute left-full top-1/2 transform -translate-y-1/2
                    ml-2 px-2 py-2 rounded-md bg-brand-black text-brand-secondary text-xs
                    invisible opacity-0 transition-all duration-200
                    group-hover:visible group-hover:opacity-100 whitespace-nowrap z-10
                  `}
                  >
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
