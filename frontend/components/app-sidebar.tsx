"use client";

// Lucide Icons
import {
  LayoutDashboard,
  Users,
  Building,
  PlusCircle,
  Eye,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";

import logo from "@/public/logo.png";
import { Separator } from "./ui/separator";
import { usePathname } from "next/navigation";

// Define your navigation items
const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "User management",
    url: "/users",
    icon: Users,
  },
  {
    title: "Office management",
    url: "/offices",
    icon: Building,
  },
  {
    title: "Add appointment",
    url: "/appointments/add",
    icon: PlusCircle,
  },
  {
    title: "View appointment",
    url: "/appointments",
    icon: Eye,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  console.log("path", pathname);

  return (
    <Sidebar>
      <SidebarContent className="bg-white w-full px- mt-0 pt-0">
        <SidebarGroup>
          <SidebarGroupLabel className=" mt-8">
            {" "}
            <Image
              src={logo}
              width={232}
              height={232}
              alt="logo"
              className=""
            />
          </SidebarGroupLabel>
          <Separator className=" bg-bran-secondary my-8" />
          <div className="px-2 ">
            <SidebarGroupContent className="bg-">
              <SidebarMenu className="">
                {items.map((item) => {
                  const isActive = pathname === item.url;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className="rounded-[2px] hover:bg-brand-primary hover:font-medium"
                      >
                        <Link
                          href={item.url}
                          className={`flex  gap-x-4 pl-4 py-6 text-[15px] font-satoshi transition-colors
                          ${
                            isActive
                              ? "bg-brand-primary text-brand-black font-semibold"
                              : "text-brand-gray hover:bg-bran-secondary  hover:text-brand-black"
                          }`}
                        >
                          <span className="grid place-content-center w-[32px] h-[32px]">
                            <Icon
                              size={24}
                              className="w-full h-full"
                              color={isActive ? "#2C2C2C" : "#999999"}
                            />
                          </span>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </div>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
