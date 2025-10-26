"use client";

import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    is_verified: boolean;
    is_system_user: boolean;
    roles: string[];
    access_token?: string;
    // expires unix timestamp (seconds)
    expires_at?: number;
  };
};

export default function NavbarClient({ user }: Props) {
    // const pathname = usePathname()
    // console.log("sssssssss",pathname)
  return (
    <div className="h-16 border-b border-bran-secondary flex justify-between items-center px-6">
      <div className="text-lg font-bold">
        Welcome KullanDesk
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-12 w-12">
              <AvatarImage src={"/avatar.png"} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.first_name[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56 bg-popover border-bran-secondary p-2"
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.first_name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              className=" py-3 font-medium hover:text-brand-primary"
              href="/profile"
            >
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="py-2 cursor-pointer">
            <LogOut className="mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
