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
  Shield,
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
      description: "System statistics",
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
      title: "My Schedule",
      href: "/host",
      icon: Calendar,
      description: "Today's appointments",
    },
    {
      title: "Availability",
      href: "/host/availabletime",
      icon: Clock,
      description: "Set availability",
    },
    {
      title: "new Appointments",
      href: "/host/appointments/add",
      icon: PlusCircle,
      description: "Create appointment",
    },
    {
      title: "view Appointments",
      href: "/host/appointments",
      icon: EyeIcon,
      description: "View appointment",
    },
    {
      title: "Notifications",
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
              <div className="flex items-center space-x-2 flex-1">
                <Image
                  src={logo}
                  alt="logo"
                  className="h-8 w-auto object-contain"
                  priority
                />
              </div>
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
                          variant={isActive ? "secondary" : "ghost"}
                          className={`w-full justify-start gap-3 hover:to-brand-primary ${isActive ? "" : "text-brand-gray"} ${open ? "px-3" : "px-2 "
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
            <div className="flex items-center gap-3 mb-4">
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
