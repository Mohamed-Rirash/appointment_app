"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client, type Appointment } from "@/helpers/api/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parseISO, isToday, isPast, startOfDay } from "date-fns"
import {
  CalendarIcon,
  Clock,
  FileText,
  Eye,
  RefreshCw,
  Users,
  CalendarDays,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Phone,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/libs/utils"
import toast from "react-hot-toast"

export default function AppointmentList({ token }: { token?: string }) {
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["appointments", format(selectedDate, "yyyy-MM-dd"), currentPage],
    queryFn: () =>
      client.getMyAppointments(token!, format(selectedDate, "yyyy-MM-dd"), pageSize, (currentPage - 1) * pageSize),
    enabled: !!token,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: string }) =>
      client.updateAppointmentStatus(appointmentId, status, token!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      toast.success(`Appointment ${variables.status.toLowerCase()} successfully`, {
        icon: variables.status === "APPROVED" ? "✅" : variables.status === "CANCELED" ? "🚫" : "❌",
      })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail?.message || error.message || "Failed to update appointment"
      toast.error(errorMessage)
    },
  })

  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: {
        bg: "bg-amber-500/10",
        text: "text-amber-600",
        border: "border-amber-200",
        dot: "bg-amber-500",
        label: "Pending",
        description: "Awaiting host review",
      },
      APPROVED: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-600",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        label: "Confirmed",
        description: "Ready for the meeting",
      },
      DENIED: {
        bg: "bg-rose-500/10",
        text: "text-rose-600",
        border: "border-rose-200",
        dot: "bg-rose-500",
        label: "Declined",
        description: "Host declined this request",
      },
      CANCELED: {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
        dot: "bg-muted-foreground",
        label: "Canceled",
        description: "Appointment was canceled",
      },
      COMPLETED: {
        bg: "bg-sky-500/10",
        text: "text-sky-600",
        border: "border-sky-200",
        dot: "bg-sky-500",
        label: "Completed",
        description: "Meeting finished successfully",
      },
      POSTPONED: {
        bg: "bg-violet-500/10",
        text: "text-violet-600",
        border: "border-violet-200",
        dot: "bg-violet-500",
        label: "Rescheduled",
        description: "Moved to another time",
      },
    }
    return (
      configs[status as keyof typeof configs] || {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
        dot: "bg-muted-foreground",
        label: status,
        description: "",
      }
    )
  }

  const isAppointmentPast = (appointmentDate: string, timeSlotted: string) => {
    const appointmentDateTime = parseISO(`${appointmentDate}T${timeSlotted}`)
    return isPast(appointmentDateTime)
  }

  const isSelectedDateToday = isToday(selectedDate)

  const canModifyAppointment = (appt: Appointment) => {
    const appointmentDateTime = parseISO(`${appt.appointment_date}T${appt.time_slotted}`)
    const isPastAppointment = isPast(appointmentDateTime)
    return !isPastAppointment && appt.status !== "COMPLETED" && appt.status !== "CANCELED"
  }

  const handleStatusUpdate = (appointmentId: string, status: "APPROVED" | "DENIED" | "CANCELED") => {
    updateStatusMutation.mutate({ appointmentId, status })
  }

  const totalAppointments = data?.total || 0
  const totalPages = Math.ceil(totalAppointments / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalAppointments)

  const goToPage = (page: number) => setCurrentPage(page)
  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPreviousPage = () => goToPage(Math.max(1, currentPage - 1))
  const goToNextPage = () => goToPage(Math.min(totalPages, currentPage + 1))

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setCurrentPage(1)
      setIsCalendarOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border bg-card">
              <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ListTodo className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Unable to Load Appointments</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          We couldn't fetch your appointments. Please check your connection and try again.
        </p>
        <Button onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    )
  }

  const appointments = data?.appointments || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isSelectedDateToday ? "Today's Appointments" : "Appointments"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSelectedDateToday ? "Manage appointments created today" : format(selectedDate, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            {totalAppointments} total
          </Badge>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <CalendarIcon className="w-4 h-4" />
                {format(selectedDate, "MMM d")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                disabled={(date) => startOfDay(date) > startOfDay(new Date())}
              />
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isLoading} className="h-9 w-9">
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>

          {!isSelectedDateToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDate(new Date())
                setCurrentPage(1)
              }}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Today
            </Button>
          )}
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed rounded-xl bg-muted/30">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <CalendarDays className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No appointments {isSelectedDateToday ? "today" : "found"}</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">
            {isSelectedDateToday
              ? "No appointments have been created for today yet."
              : `No appointments on ${format(selectedDate, "MMMM d, yyyy")}.`}
          </p>
          {!isSelectedDateToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDate(new Date())
                setCurrentPage(1)
              }}
              className="gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              View Today
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>
              Showing {startItem}–{endItem} of {totalAppointments}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Updated {format(new Date(), "h:mm a")}
            </span>
          </div>

          <div className="space-y-3">
            {appointments.map((appt) => {
              const time = appt.time_slotted.substring(0, 5)
              const fullName = `${appt.citizen_firstname} ${appt.citizen_lastname}`
              const isPastAppointment = isAppointmentPast(appt.appointment_date, appt.time_slotted)
              const statusConfig = getStatusConfig(appt.status)
              const appointmentDate = parseISO(appt.appointment_date)
              const isAppointmentToday = isToday(appointmentDate)
              const canModify = canModifyAppointment(appt)

              return (
                <Card
                  key={appt.appointment_id}
                  className={cn(
                    "group transition-all duration-200 hover:shadow-md",
                    isPastAppointment && "opacity-60",
                    updateStatusMutation.isPending && "pointer-events-none opacity-70",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Time block */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center text-center transition-colors",
                          isPastAppointment ? "bg-muted text-muted-foreground" : "bg-primary/5 text-primary",
                        )}
                      >
                        <Clock className="w-4 h-4 mb-0.5" />
                        <span className="text-sm font-semibold">{time}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground truncate">{fullName}</h3>
                            <p className="text-sm text-muted-foreground">{statusConfig.description}</p>
                          </div>

                          {/* Status badge */}
                          <Badge
                            variant="outline"
                            className={cn(
                              "flex-shrink-0 font-medium",
                              statusConfig.bg,
                              statusConfig.text,
                              statusConfig.border,
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", statusConfig.dot)} />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {appt.purpose && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{appt.purpose}</span>
                            </div>
                          )}
                          {appt.citizen_phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              <span>{appt.citizen_phone}</span>
                            </div>
                          )}
                          {!isAppointmentToday && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                              <span>{format(appointmentDate, "MMM d, yyyy")}</span>
                            </div>
                          )}
                          {appt.decision_reason && (
                            <div className="flex items-center gap-2 text-muted-foreground col-span-full">
                              <Eye className="w-4 h-4 flex-shrink-0" />
                              <span className="italic truncate">{appt.decision_reason}</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        {canModify && (
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                            {(appt.status === "PENDING" || appt.status === "APPROVED") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(appt.appointment_id, "CANCELED")}
                                disabled={updateStatusMutation.isPending}
                                className="h-8 text-xs gap-1.5"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 bg-transparent"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 mx-1">
                  {(() => {
                    const buttons = []
                    const maxButtons = 5
                    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
                    const endPage = Math.min(totalPages, startPage + maxButtons - 1)

                    if (endPage - startPage < maxButtons - 1) {
                      startPage = Math.max(1, endPage - maxButtons + 1)
                    }

                    if (startPage > 1) {
                      buttons.push(
                        <Button
                          key={1}
                          variant="outline"
                          size="icon"
                          onClick={() => goToPage(1)}
                          className="h-8 w-8 text-xs"
                        >
                          1
                        </Button>,
                      )
                      if (startPage > 2) {
                        buttons.push(
                          <span key="start-ellipsis" className="px-1 text-muted-foreground">
                            …
                          </span>,
                        )
                      }
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      buttons.push(
                        <Button
                          key={i}
                          variant={currentPage === i ? "default" : "outline"}
                          size="icon"
                          onClick={() => goToPage(i)}
                          className="h-8 w-8 text-xs"
                        >
                          {i}
                        </Button>,
                      )
                    }

                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        buttons.push(
                          <span key="end-ellipsis" className="px-1 text-muted-foreground">
                            …
                          </span>,
                        )
                      }
                      buttons.push(
                        <Button
                          key={totalPages}
                          variant="outline"
                          size="icon"
                          onClick={() => goToPage(totalPages)}
                          className="h-8 w-8 text-xs"
                        >
                          {totalPages}
                        </Button>,
                      )
                    }

                    return buttons
                  })()}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 bg-transparent"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 bg-transparent"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
