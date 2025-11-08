"use client"
import { useState } from "react";
import AddForm from "./addForm";
import AppointmentList from "./AppointmentList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List } from "lucide-react";

interface formData {
    hostId: string
    officeId: string
    token?: string
}

export default function AppointmentManager({ officeId, hostId, token }: formData) {
  const [activeTab, setActiveTab] = useState('book');

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Appointment Manager</h1>
        <p className="text-muted-foreground">
          Book new appointments or manage your existing ones
        </p>
      </div>

      {/* Tabs Section */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-2 h-14 rounded-none bg-transparent p-0">
                <TabsTrigger 
                  value="book" 
                  className="relative py-4 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent data-[state=inactive]:bg-transparent transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold">Book Appointment</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="view" 
                  className="relative py-4 data-[state=active]:shadow-none rounded-none border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent data-[state=inactive]:bg-transparent transition-all"
                >
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    <span className="font-semibold">My Appointments</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="book" className="m-0">
                <AddForm office_id={officeId} token={token} host_id={hostId} />
              </TabsContent>
              
              <TabsContent value="view" className="m-0">
                <AppointmentList />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mobile View - Alternative Button Layout */}
      <div className="block md:hidden">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={activeTab === 'book' ? "default" : "outline"}
                onClick={() => setActiveTab('book')}
                className="justify-center gap-2 py-3"
              >
                <Calendar className="w-4 h-4" />
                Book
              </Button>
              <Button
                variant={activeTab === 'view' ? "default" : "outline"}
                onClick={() => setActiveTab('view')}
                className="justify-center gap-2 py-3"
              >
                <List className="w-4 h-4" />
                My Appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}