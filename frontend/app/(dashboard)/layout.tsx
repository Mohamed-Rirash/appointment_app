import { AppSidebar } from "@/components/app-sidebar";
import Navbar from "@/components/Navbar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function LayoutDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="bg-amber-200 ">
            <Navbar />
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
