"use client";
import { useState } from "react";
import AddForm from "./addForm";
import AppointmentList from "./AppointmentList";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List, Users, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AppointmentManagerProps {
  hostId: string;
  officeId: string;
  token?: string;
}

export default function AppointmentManager({
  officeId,
  hostId,
  token,
}: AppointmentManagerProps) {
  const [activeTab, setActiveTab] = useState("book");

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-brand/10 rounded-full">
            <Users className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Appointment Management
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Create and manage citizen appointments efficiently. Streamline visit
          scheduling and track all bookings.
        </p>
        <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
          <UserPlus className="w-3 h-3 mr-1.5" />
          Reception Management System
        </Badge>
      </div>

      {/* Main Tabs Section */}
      <Card className="shadow-sm border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Enhanced Tab Headers */}
            <div className=" bg-gradient-to-b from-background to-background/95">
              <TabsList className="grid w-full grid-cols-2 h-16 rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="book"
                  className="relative py-5 data-[state=active]:shadow-none rounded-none data-[state=active]:text-brand data-[state=inactive]:text-muted-foreground data-[state=inactive]:bg-transparent data-[state=active]:bg-transparent transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand/10 group-data-[state=active]:bg-brand/20 transition-colors">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-lg block">
                        Create Appointment
                      </span>
                      <span className="text-xs text-muted-foreground group-data-[state=active]:text-brand/70">
                        Schedule for citizen
                      </span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent group-data-[state=active]:bg-brand transition-colors" />
                </TabsTrigger>

                <TabsTrigger
                  value="view"
                  className="relative py-5 data-[state=active]:shadow-none rounded-none data-[state=active]:text-brand data-[state=inactive]:text-muted-foreground data-[state=inactive]:bg-transparent data-[state=active]:bg-transparent transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand/10 group-data-[state=active]:bg-brand/20 transition-colors">
                      <List className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-lg block">
                        Appointment Records
                      </span>
                      <span className="text-xs text-muted-foreground group-data-[state=active]:text-brand/70">
                        View and manage all bookings
                      </span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent group-data-[state=active]:bg-brand transition-colors" />
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              <TabsContent value="book" className="m-0 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Schedule Citizen Visit
                  </h2>
                  <p className="text-muted-foreground">
                    Enter citizen details and schedule their appointment. All
                    fields are required to ensure proper booking.
                  </p>
                </div>
                <AddForm office_id={officeId} token={token} host_id={hostId} />
              </TabsContent>

              <TabsContent value="view" className="m-0 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-foreground">
                    All Appointments
                  </h2>
                  <p className="text-muted-foreground">
                    Overview of scheduled visits. Monitor status, manage
                    bookings, and track citizen appointments.
                  </p>
                </div>
                <AppointmentList token={token} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Administrative system for managing citizen appointments and visit
          schedules.
        </p>
      </div>
    </div>
  );
}
