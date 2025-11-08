"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Clock, User, FileText, Eye, Filter } from "lucide-react";

export default function AppointmentList({ token }: { token?: string }) {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data, isLoading, error } = useQuery({
    queryKey: ["appointments", today],
    queryFn: () => client.getMyAppointments(token!, today),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <Skeleton className="h-7 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-3">
            <FileText className="w-12 h-12 mx-auto opacity-50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Unable to Load Appointments</h3>
          <p className="text-muted-foreground mb-4">
            There was an error fetching today's appointments. Please try again.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const appointments = data?.appointments || [];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "DENIED":
        return "bg-red-100 text-red-800 border-red-200";
      case "CANCELED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "✅";
      case "PENDING":
        return "⏳";
      case "DENIED":
        return "❌";
      case "CANCELED":
        return "📝";
      default:
        return "📅";
    }
  };

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-brand" />
              Today's Schedule
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled for today
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="w-4 h-4" />
              View All
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {appointments.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Appointments Today</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              There are no scheduled appointments for today. New appointments you create will appear here.
            </p>
            <Button variant="default" className="gap-2">
              <User className="w-4 h-4" />
              Create First Appointment
            </Button>
          </div>
        ) : (
          <div className="space-y-3 p-6 pt-0">
            {appointments.map((appt) => {
              const time = appt.time_slotted.substring(0, 5);
              const fullName = `${appt.citizen_firstname} ${appt.citizen_lastname}`;
              const isPast = new Date(`${appt.appointment_date}T${appt.time_slotted}`) < new Date();

              return (
                <div
                  key={appt.appointment_id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                    isPast
                      ? "bg-muted/30 border-muted text-muted-foreground"
                      : "bg-white border-border hover:border-brand/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                        isPast ? "bg-muted" : "bg-brand/10 text-brand"
                      }`}>
                        <Clock className="w-4 h-4 mb-1" />
                        <span className="text-sm font-bold">{time}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-base truncate">
                            {fullName}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium border ${getStatusVariant(appt.status)}`}
                          >
                            <span className="mr-1">{getStatusIcon(appt.status)}</span>
                            {appt.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                          <FileText className="w-3 h-3" />
                          {appt.purpose}
                        </p>
                        
                        {appt.citizen_phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            {appt.citizen_phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="flex-shrink-0 ml-2">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {/* Summary Footer */}
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  Showing {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Last updated: {format(new Date(), 'HH:mm')}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}