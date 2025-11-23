import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Signout } from "@/helpers/actions/signout";
import { NotificationBell } from "./NotificationBell";
import Link from "next/link";

interface DashboardHeaderProps {
  user: {
    first_name: string;
    last_name: string;
    email: string;
    access_token: string,
    office_id: string,
    roles: string[],
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {

  return (
    <header className="flex h-16 items-center justify-end border-b bg-card px-6">


      <div className="flex items-center gap-4">
        <div className="">
          <NotificationBell user={user} />
        </div>

        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild> */}
        <Button variant="ghost" size="sm">
          {user.first_name} {user.last_name}
        </Button>
        {/* </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile Settings</Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-100 bg-red-500" asChild>
              <form action={Signout} className="w-full">
                <button type="submit" className="w-full text-left py-2">Logout</button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
    </header>
  );
}