"use client";

import {
  LayoutDashboard,
  Users as UsersIcon,
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";
import { Separator } from "./ui/separator";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "User management", url: "/users", icon: UsersIcon },
  { title: "Office management", url: "/offices", icon: Building },
  { title: "Add appointment", url: "/appointments/add", icon: PlusCircle },
  { title: "View appointment", url: "/appointments", icon: Eye },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <TooltipProvider>
      <Sidebar
        collapsible="icon"
        className="bg-white border-r border-[#eeeeee]"
      >
        <SidebarHeader className="bg-white py-8 px-2">
          {open && (
            <Image
              src={logo}
              width={332}
              height={332}
              alt="logo"
              className=""
            />
          )}{" "}
          {/* PEOPLE ICON - only when collapsed */}
          {!open && (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand">
              <UsersIcon size={16} className="text-white" />
            </div>
          )}
        </SidebarHeader>
        <Separator className="" />
        <SidebarContent className="flex flex-col h-full bg-white px-2">
          {/* Main Menu */}
          <SidebarGroup className="flex-grow">
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = pathname === item.url;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            className={`rounded-[4px] py-6 hover:bg-brand-primary transition-all duration-200 font-medium ${
                              isActive
                                ? "bg-brand-primary text-brand-black font-bold"
                                : "text-brand-gray hover:bg-brand-primary hover:text-brand-black"
                            }`}
                          >
                            <Link
                              href={item.url}
                              className="flex  pl-4 text-[16px] font-satoshi"
                            >
                              <span className=" w-[24px] h-[24px] rounded-md">
                                <Icon
                                  className={`w-full h-full ${
                                    isActive
                                      ? "text-brand-black"
                                      : "text-brand-gray"
                                  }`}
                                />
                              </span>
                              {open && (
                                <span className="pl-[5px]">{item.title}</span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {/* {!open && (
                          <TooltipContent
                            side="right"
                            className="bg-brand-primary text-brand-black"
                          >
                            {item.title}
                          </TooltipContent>
                        )} */}
                        {open ? (
                          ""
                        ) : (
                          <TooltipContent
                            side="right"
                            className="bg-brand-black text-brand-primary"
                          >
                            {item.title}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Bottom: Sign Out */}
          {/* <SidebarGroup className="">
            <SidebarGroupContent>
              <div className=" flex ">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 cursor-pointer">
                      <span className="text-white text-lg font-medium">N</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-brand-black text-white"
                  >
                    Sign Out
                  </TooltipContent>
                </Tooltip>
              </div>
            </SidebarGroupContent>
          </SidebarGroup> */}
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
