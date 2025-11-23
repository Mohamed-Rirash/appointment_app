"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building,
  Calendar,
  UserCheck,
  Clock,
  LogOut,
  ChevronsRight,
  ChevronsLeft,
  Bell,
  PlusCircle,
  EyeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Signout } from "@/helpers/actions/signout";
import { useEffect } from "react";
import Image from "next/image";
import logo from "@/public/logo.png";
import useLocalStorage from "@/helpers/hooks/sidebar/useLocalStorage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

interface RoleSidebarProps {
  role: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    office_id?: string;
  };
  className?: string;
}

const navigationConfig = {
  admin: [
    {
      title: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      description: "System overview",
    },
    {
      title: "Users",
      href: "/admin/members",
      icon: Users,
      description: "Manage system users",
    },
    {
      title: "Offices",
      href: "/admin/offices",
      icon: Building,
      description: "Office management",
    },
    // {
    //   title: "Security",
    //   href: "/admin/security",
    //   icon: Shield,
    //   description: "Audit logs",
    // },
  ],
  reception: [
    {
      title: "Overview",
      href: "/reception",
      icon: LayoutDashboard,
      description: "System statistics",
    },
    {
      title: "Check-In",
      href: "/reception/check-in",
      icon: UserCheck,
      description: "Citizen check-in",
    },
    {
      title: "new Appointments",
      href: "/reception/appointments/add",
      icon: PlusCircle,
      description: "Create appointment",
    },
    {
      title: "View Appointments",
      href: "/reception/appointments",
      icon: Calendar,
      description: "Today's schedule",
    },
  ],
  host: [
    {
      title: "Dashboard",
      href: "/host",
      icon: Calendar,
      description: "Dashboard",
    },
    {
      title: "Availability",
      href: "/host/availabletime",
      icon: Clock,
      description: "Set availability",
    },
    {
      title: "New Appointments",
      href: "/host/appointments/add",
      icon: PlusCircle,
      description: "New appointment",
    },
    {
      title: "View Appointments",
      href: "/host/appointments",
      icon: EyeIcon,
      description: "View appointment",
    },
    {
      title: "Incoming Appointments",
      href: "/host/notifications",
      icon: Bell,
      description: "Appointment requests",
    },
  ],
};

export function RoleSidebar({ role, user, className }: RoleSidebarProps) {
  const pathname = usePathname();
  const navItems =
    navigationConfig[role as keyof typeof navigationConfig] ||
    navigationConfig.host;

  // Usage in component:
  const [open, setOpen] = useLocalStorage("sidebar-open", true);

  // Load saved state on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-open");
    if (saved !== null) {
      setOpen(JSON.parse(saved));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !open;
    setOpen(newState);
    localStorage.setItem("sidebar-open", JSON.stringify(newState));
  };

  return (
    <TooltipProvider>
      {/* Fixed width container with transition */}
      <div
        className={`${open ? "w-64" : "w-16"
          } transition-all duration-300 ease-in-out shrink-0 `}
      >
        <div className="flex h-full flex-col border-r bg-card">
          {/* Logo Section - Fixed */}
          <div className="flex items-center justify-between p-4 border-b">
            {open && (
              <Link href={"/"}>
                <div className="flex items-center space-x-2 flex-1">
                  <Image
                    src={logo}
                    alt="logo"
                    className="h-24 w-auto object-contain"
                    priority
                  />
                </div>
              </Link>

            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="shrink-0"
              aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            >
              {open ? (
                <ChevronsLeft className="h-5 w-5" />
              ) : (
                <ChevronsRight className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Navigation Items - Fixed */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="grid gap-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <Button
                          // variant={isActive ? "secondary" : "ghost"}
                          className={`w-full justify-start gap-3  ${isActive ? "bg-brand hover:bg-brand/90" : "text-brand-gray bg-transparent hover:bg-brand-primary hover:text-brand-black hover:font-semibold"} ${open ? "px-3" : "px-2 "
                            }`}
                          size="lg"
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {open && (
                            <span className="truncate">{item.title}</span>
                          )}
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right">
                        {item.description}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </div>

          {/* User Profile Section - Fixed */}
          <div className="mt-auto border-t p-4">

            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-3 mb-4 cursor-pointer">
                  <Avatar className="shrink-0">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    />
                    <AvatarFallback>
                      {user.first_name[0]}
                      {user.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {open && (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize truncate">
                        {role}
                      </p>
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      />
                      <AvatarFallback className="text-sm">
                        {user.first_name[0]}
                        {user.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold truncate">
                        {user.first_name} {user.last_name}
                      </h4>
                      <p className="text-xs text-muted-foreground capitalize">
                        {role}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-semibold">{user.email}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Full Name</Label>
                      <p className="text-sm font-semibold">{user.first_name} {user.last_name}</p>
                    </div>

                    {/* {user.username && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Username</Label>
                        <p className="text-sm">@{user.username}ddd</p>
                      </div>
                    )} */}
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 py-4" asChild>
                      <Link href="/profile">
                        View Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              className={`w-full gap-2 ${open ? "justify-start" : "justify-center"
                }`}
              size="sm"
              onClick={() => Signout()}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {open && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
