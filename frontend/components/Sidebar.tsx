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
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton"; // 👈 import Skeleton
import logo from "@/public/logo.png";

const NavItem = memo(
  ({
    item,
    isActive,
    open,
  }: {
    item: { label: string; url: string; icon: any };
    isActive: boolean;
    open: boolean;
  }) => {
    return (
      <div className="group relative">
        <Button
          asChild
          variant={isActive ? "secondary" : "ghost"}
          className={`w-full justify-start ${open ? "" : "justify-center"
            } rounded-[4px] py-6 hover:bg-brand-primary transition-all duration-200 font-normal ${isActive
              ? "bg-brand-primary text-brand-black font-bold"
              : "text-brand-gray hover:bg-brand-primary hover:text-brand-black hover:font-medium"
            }`}
        >
          <Link href={item.url} className="text-[16px]">
            <item.icon className={`h-6! w-6! ${open ? "mr-2" : "h-7! w-7!"}`} />
            {open && <span>{item.label}</span>}
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
  }
);

NavItem.displayName = "NavItem";

function Sidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const [role, setRole] = useState<string>("");

  const toggleSidebar = () => setOpen((prev) => !prev);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await fetch("/api/user/role");
        const data = await response.json();
        setRole(data.role);
      } catch (error) {
        console.error("Failed to fetch role:", error);
      }
    };
    fetchRole();
  }, []);

  // 🌍 Memoize dashboard URL based on role
  const dashboardUrl = useMemo(() => {
    if (role === "host" || role === "secretary") return "/host";
    if (role === "reception") return "/reception";
    if (role === "admin") return "/";
    return "/Signin";
  }, [role]);

  // 🧭 Memoize role-based items to prevent recreation on every render
  const items = useMemo(() => {
    if (role === "admin") {
      return [
        { label: "Dashboard", url: dashboardUrl, icon: LayoutDashboard },
        { label: "Members", url: "/members", icon: UsersIcon },
        { label: "Office management", url: "/offices", icon: Building },
      ];
    } else if (role) {
      return [
        { label: "Dashboard", url: dashboardUrl, icon: LayoutDashboard },
        { label: "Add appointment", url: "/appointments/add", icon: PlusCircle },
        { label: "View appointment", url: "/appointments", icon: Eye },
      ];
    }
    return [];
  }, [role, dashboardUrl]);

  // 🦴 Skeleton Loader when role is not ready
  if (!role) {
    return (
      <aside
        className={`bg-white border-r border-brand-secondary transition-all duration-300 ease-in-out flex flex-col ${open ? "w-60 px-4" : "w-16 px-0"
          }`}
      >
        {/* Header skeleton */}
        <div
          className={`flex items-center ${open ? "justify-between" : "justify-center"
            } py-8 border-b border-[#eeeeee]`}
        >
          {open && (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          )}
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>

        {/* Nav skeletons */}
        <nav className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`${open ? "h-10 w-full" : "h-10 w-10 mx-auto"
                } rounded-[4px]`}
            />
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside
      className={`bg-white border-r border-brand-secondary transition-all duration-300 ease-in-out flex flex-col ${open ? "w-60 px-4" : "w-16 px-0"
        }`}
    >
      {/* Header with Logo and Toggle */}
      <div
        className={`flex items-center ${open ? "justify-between" : "justify-center"
          } py-8 border-b border-[#eeeeee]`}
      >
        {open && (
          <div className="flex items-center space-x-2">
            <Image src={logo} height={324} width={324} alt="logo" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={open ? "" : "w-full"}
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
        {items.map((item) => {
          const isActive = pathname === item.url;
          return (
            <NavItem
              key={item.url}
              item={item}
              isActive={isActive}
              open={open}
            />
          );
        })}
      </nav>
    </aside>
  );
}

export default memo(Sidebar);
