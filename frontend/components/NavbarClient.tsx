"use client";

import { LogOut, Settings } from "lucide-react";
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
import { Signout } from "@/helpers/actions/signout";

interface User {

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

export default function NavbarClient({ user }: { user: User }) {
  return (
    <div className="h-16 border-b border-bran-secondary flex justify-end items-center px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild  >
          <Button variant="ghost" className="flex items-center mr-4 py-6 ">
            <Avatar className="h-9 w-9">
              <AvatarImage src={"/avatar.png"} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.first_name[0]?.toUpperCase() || "A"}
              </AvatarFallback>

            </Avatar>
            <h3 className="font-medium text-lg text-brand-black"> {user.first_name} </h3>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56 bg-popover border-bran-secondary p-2"
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-[16px] font-medium leading-none">
                {user.first_name}
              </p>
              <p className="text-sm leading-none text-muted-foreground">
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
              <Settings className="mr-2" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => Signout()} className="py-2 cursor-pointer">
            <LogOut className="mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
