import { AppSidebar } from "@/components/app-sidebar";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
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
          <main className="">
            <Navbar />
            {children}
            <Toaster />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
