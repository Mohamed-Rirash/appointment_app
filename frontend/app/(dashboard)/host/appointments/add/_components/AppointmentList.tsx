"use client";
import { useQuery } from "@tanstack/react-query";
import { client, Appointment } from "@/helpers/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO, isToday, isPast } from "date-fns";
import { Calendar as CalendarIcon, Clock, User, FileText, Eye, RefreshCw, Users, CalendarDays, Plus, ListTodo, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/libs/utils";


export default function AppointmentList({ token }: { token?: string }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["appointments", format(selectedDate, "yyyy-MM-dd"), currentPage],
    queryFn: () => client.getMyAppointments(
      token!,
      format(selectedDate, "yyyy-MM-dd"),
      pageSize,
      (currentPage - 1) * pageSize
    ),
    enabled: !!token,
  });

  const getStatusVariant = (status: string) => {
    const variants = {
      "PENDING": "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
      "APPROVED": "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
      "DENIED": "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100",
      "CANCELED": "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200",
      "COMPLETED": "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100",
      "POSTPONED": "bg-violet-50 text-violet-800 border-violet-200 hover:bg-violet-100",
    };
    return variants[status as keyof typeof variants] || "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200";
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      "PENDING": { icon: "⏳", text: "Awaiting Host Review", description: "Waiting for host approval" },
      "APPROVED": { icon: "✅", text: "Confirmed", description: "Ready for the meeting" },
      "DENIED": { icon: "❌", text: "Declined by Host", description: "Host declined this appointment" },
      "CANCELED": { icon: "🚫", text: "Canceled", description: "Appointment was canceled" },
      "COMPLETED": { icon: "✅", text: "Completed", description: "Meeting finished successfully" },
      "POSTPONED": { icon: "📅", text: "Rescheduled", description: "Moved to another time" },
    };
    return configs[status as keyof typeof configs] || { icon: "📅", text: status, description: "" };
  };

  const isAppointmentPast = (appointmentDate: string, timeSlotted: string) => {
    const appointmentDateTime = parseISO(`${appointmentDate}T${timeSlotted}`);
    return isPast(appointmentDateTime);
  };

  const isSelectedDateToday = isToday(selectedDate);

  // Pagination calculations
  const totalAppointments = data?.total || 0;
  const totalPages = Math.ceil(totalAppointments / pageSize);
  const startItem = ((currentPage - 1) * pageSize) + 1;
  const endItem = Math.min(currentPage * pageSize, totalAppointments);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => goToPage(Math.min(totalPages, currentPage + 1));

  // Reset to first page when date changes
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCurrentPage(1);
      setIsCalendarOpen(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-border/50 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-7 w-48" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
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
      <Card className="shadow-sm border-border/50 bg-white">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
            <ListTodo className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-slate-900">Unable to Load Your Appointments</h3>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">
            We're having trouble loading the appointments you've created. Please check your connection and try again.
          </p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading
          </Button>
        </CardContent>
      </Card>
    );
  }

  const appointments = data?.appointments || [];

  return (
    <Card className="shadow-sm border-border/50 bg-white">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-brand/10 rounded-lg">
                <ListTodo className="w-6 h-6 text-brand" />
              </div>
              <div>
                {isSelectedDateToday ? "Today's Created Appointments" : "My Created Appointments"}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs font-normal">
                    <Users className="w-3 h-3 mr-1" />
                    {totalAppointments} appointments created
                  </Badge>
                </div>
              </div>
            </CardTitle>
            <CardDescription className="text-slate-600 text-base">
              {isSelectedDateToday
                ? "Overview of all appointments you've created today and their current status"
                : `Appointments you created for ${format(selectedDate, 'EEEE, MMMM d, yyyy')}`
              }
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild className="hover:bg-brand-primary">
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal gap-2",
                    !selectedDate && "text-brand-gray"
                  )}
                >
                  <CalendarIcon className="w-4 h-4" />
                  Appointments for {format(selectedDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
              className="shrink-0"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>

            {!isSelectedDateToday && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDate(new Date());
                  setCurrentPage(1);
                }}
                className="shrink-0 gap-2"
              >
                <CalendarIcon className="w-4 h-4" />
                Today's
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {appointments.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900">
              No Appointments Created Yet
            </h3>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto">
              {isSelectedDateToday
                ? "You haven't created any appointments today. Start by creating your first appointment to get started."
                : `You didn't create any appointments for ${format(selectedDate, 'MMMM d, yyyy')}.`
              }
            </p>
            <div className="flex gap-3 justify-center">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create New Appointment
              </Button>
              {!isSelectedDateToday && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDate(new Date());
                    setCurrentPage(1);
                  }}
                  className="gap-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  View Today's
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-6 pt-0">
            {/* Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-lg border gap-3">
              <div className="flex items-center gap-4 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  <span>
                    Showing <strong>{startItem}-{endItem}</strong> of <strong>{totalAppointments}</strong> appointments you created
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Last refreshed: {format(new Date(), 'h:mm a')}</span>
                </div>
              </div>
            </div>

            {/* Appointments List */}

            <div className="space-y-3">
              {appointments.map((appt) => {
                const time = appt.time_slotted.substring(0, 5);
                const fullName = `${appt.citizen_firstname} ${appt.citizen_lastname}`;
                const isPastAppointment = isAppointmentPast(appt.appointment_date, appt.time_slotted);
                const statusConfig = getStatusConfig(appt.status);
                const appointmentDate = parseISO(appt.appointment_date);
                const isAppointmentToday = isToday(appointmentDate);

                return (
                  <div
                    key={appt.appointment_id}
                    className={cn(
                      "p-5 rounded-xl border transition-all hover:shadow-md group",
                      isPastAppointment
                        ? "bg-slate-50 border-slate-200 text-slate-600"
                        : "bg-white border-slate-200 hover:border-brand/30"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Time Badge */}
                        <div
                          className={cn(
                            "flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-colors",
                            isPastAppointment
                              ? "bg-slate-100 border-slate-300 text-slate-500"
                              : "bg-brand/5 border-brand/20 text-brand group-hover:bg-brand/10"
                          )}
                        >
                          <Clock className="w-3 h-3 mb-1" />
                          <span className="text-sm font-bold">{time}</span>
                        </div>

                        {/* Appointment Details */}
                        <div className="flex-1 min-w-0 space-y-3">
                          {/* Header with name and status */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div>
                              <h4 className="font-semibold text-lg text-slate-900 truncate">
                                {fullName}
                              </h4>
                              <p className="text-sm text-slate-500">
                                Citizen appointment
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-medium border shrink-0",
                                getStatusVariant(appt.status)
                              )}
                            >
                              <span className="mr-1">{statusConfig.icon}</span>
                              {statusConfig.text}
                            </Badge>
                          </div>

                          {/* Purpose and contact */}
                          <div className="space-y-2">
                            <p className="text-sm text-slate-700 flex items-start gap-2">
                              <FileText className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                              <span><strong>Purpose:</strong> {appt.purpose}</span>
                            </p>

                            {appt.citizen_phone && (
                              <p className="text-sm text-slate-600 flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400 shrink-0" />
                                <span><strong>Contact:</strong> {appt.citizen_phone}</span>
                              </p>
                            )}
                          </div>

                          {/* Additional information */}
                          <div className="space-y-1">
                            {/* Decision Reason */}
                            {appt.decision_reason && (
                              <p className="text-sm text-slate-500 italic">
                                <strong>Host feedback:</strong> {appt.decision_reason}
                              </p>
                            )}

                            {/* Appointment Date if different from selected */}
                            {!isAppointmentToday && (
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                Scheduled for {format(appointmentDate, 'MMM d, yyyy')}
                              </p>
                            )}

                            {/* Status description */}
                            <p className="text-xs text-slate-400">
                              {statusConfig.description}shit
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages} • {totalAppointments} total appointments
                </div>

                <div className="flex items-center gap-1">
                  {/* First Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                    <span className="sr-only">First page</span>
                  </Button>

                  {/* Previous Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className={cn(
                            "h-8 w-8 p-0 text-xs",
                            currentPage === pageNum && "bg-brand text-white"
                          )}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Next Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                  </Button>

                  {/* Last Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                    <span className="sr-only">Last page</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}