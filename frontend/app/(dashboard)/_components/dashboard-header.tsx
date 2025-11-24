import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";


interface DashboardHeaderProps {
  user: {
    first_name: string;
    last_name: string;
    email: string;
    access_token?: string;
    office_id: string;
    roles: string[];
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
      </div>
    </header>
  );
}