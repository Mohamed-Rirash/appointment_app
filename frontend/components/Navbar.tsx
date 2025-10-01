import { LogOut, User } from "lucide-react";
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
import { SidebarTrigger } from "./ui/sidebar";
import { auth, signOut } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/fuctions/auth-guard";

export default async function Navbar() {
  const user = await requireAuth();
  return (
    <>
      <div className="h-16 border-b border-bran-secondary flex justify-between items-center px-4">
        <div className="bg-  flex justify-center items-center">
          {" "}
          <SidebarTrigger className="ml-" />
        </div>
        <div className="">
          {" "}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={"/avatar.png"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    A
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
                    {user!.first_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user!.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="hover:to-brand-primary font-medium py-3"
                asChild
              >
                <Link className="pl-6" href={"/profile"}>
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="">
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  <Button
                    className="hover:to-brand-primary hover:font-medium py-2"
                    variant={"ghost"}
                    type="submit"
                  >
                    <LogOut />
                    Sign Out
                  </Button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
