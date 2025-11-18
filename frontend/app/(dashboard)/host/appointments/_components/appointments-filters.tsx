"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, Calendar, X, SlidersHorizontal, Clock, User, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface AppointmentsFiltersProps {
    currentStatus: string;
    currentDate: string;
    currentSearch: string;
    totalCount: number;
    onFilterChange: (filters: { status?: string; date?: string; search?: string; page?: string }) => void;
}

export function AppointmentsFilters({
    currentStatus,
    currentDate,
    currentSearch,
    totalCount,
    onFilterChange,
}: AppointmentsFiltersProps) {
    const [searchInput, setSearchInput] = useState(currentSearch);
    const [localStatus, setLocalStatus] = useState(currentStatus);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Sync local state with props
    useEffect(() => {
        setSearchInput(currentSearch);
        setLocalStatus(currentStatus);

        // Parse date from currentDate string
        if (currentDate && currentDate !== "today" && currentDate !== "all") {
            try {
                const date = new Date(currentDate);
                if (!isNaN(date.getTime())) {
                    setSelectedDate(date);
                }
            } catch {
                setSelectedDate(undefined);
            }
        } else {
            setSelectedDate(undefined);
        }
    }, [currentSearch, currentStatus, currentDate]);

    const handleStatusChange = (status: string) => {
        setLocalStatus(status);
        onFilterChange({
            status,
            search: "" // Clear search when changing status
        });
    };

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        setIsCalendarOpen(false);

        if (date) {
            onFilterChange({
                date: format(date, "yyyy-MM-dd")
            });
        } else {
            onFilterChange({ date: "today" });
        }
    };

    const handleSearch = () => {
        const trimmedSearch = searchInput.trim();
        onFilterChange({
            search: trimmedSearch,
            status: "all" // Clear status when searching
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const clearSearch = () => {
        setSearchInput("");
        onFilterChange({ search: "" });
    };

    const clearDate = () => {
        setSelectedDate(undefined);
        onFilterChange({ date: "today" });
    };

    const clearFilters = () => {
        setSearchInput("");
        setLocalStatus("all");
        setSelectedDate(undefined);
        onFilterChange({
            status: "all",
            date: "today",
            search: "",
            page: "1"
        });
    };

    const hasActiveFilters = localStatus !== "all" || selectedDate || currentSearch;
    const hasSearch = currentSearch && currentSearch.trim() !== "";

    const getDateDisplay = () => {
        if (selectedDate) {
            return format(selectedDate, "MMM dd, yyyy");
        }
        return "Today";
    };

    return (
        <Card className="bg-linear-to-br from-white to-brand-primary/50 border-0 shadow-lg">
            <CardContent className="p-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary rounded-lg">
                            <SlidersHorizontal className="h-5 w-5 text-brand" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Filter Appointments</h2>
                            <p className="text-sm text-gray-600">Find specific appointments using filters and search</p>
                        </div>
                    </div>

                    {/* Enhanced Search Bar */}
                    <div className="flex gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search by citizen name, email, phone, or purpose..."
                                className="pl-11 pr-10 py-3 h-12 text-base rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 bg-white shadow-sm"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            {searchInput && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-7 w-7 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={!searchInput.trim()}
                            className="h-12 px-6 bg-brand/90 hover:bg-brand text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                        {/* Results Count and Active Filters */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {totalCount.toLocaleString()} Appointment{totalCount !== 1 ? 's' : ''}
                                </h3>
                                {!hasActiveFilters && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        All appointments
                                    </Badge>
                                )}
                            </div>

                            {/* Active Filter Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {hasSearch && (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5">
                                        <Search className="h-3.5 w-3.5 mr-1.5" />
                                        Search: "{currentSearch}"
                                        <button onClick={clearSearch} className="ml-2 hover:text-blue-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {localStatus !== "all" && (
                                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1.5 capitalize">
                                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                                        Status: {localStatus.toLowerCase()}
                                    </Badge>
                                )}
                                {selectedDate && (
                                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5">
                                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                        Date: {getDateDisplay()}
                                        <button onClick={clearDate} className="ml-2 hover:text-green-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Filter Controls */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-3">
                                {/* Date Picker */}
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full sm:w-48 h-11 justify-start text-left font-normal rounded-xl border-gray-300 bg-white shadow-sm hover:bg-gray-50"
                                        >
                                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                            {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={handleDateSelect}
                                            disabled={(date) => date > new Date()} // Only allow past dates
                                            className="rounded-xl"
                                        />
                                    </PopoverContent>
                                </Popover>

                                {/* Status Filter */}
                                <Select value={localStatus || "all"} onValueChange={handleStatusChange}>
                                    <SelectTrigger className="w-full sm:w-44 rounded-xl border-gray-300 bg-white shadow-sm h-11">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-4 w-4 text-gray-500" />
                                            <SelectValue placeholder="Status" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                                        <SelectItem value="all" className="rounded-lg">All Status</SelectItem>
                                        <SelectItem value="PENDING" className="rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                Pending
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="APPROVED" className="rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                                Approved
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="COMPLETED" className="rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Search className="h-3.5 w-3.5 text-green-500" />
                                                Completed
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="CANCELLED" className="rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <X className="h-3.5 w-3.5 text-red-500" />
                                                Cancelled
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="NO_SHOW" className="rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <User className="h-3.5 w-3.5 text-red-500" />
                                                No Show
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="DENIED" className="rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <X className="h-3.5 w-3.5 text-red-500" />
                                                Denied
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="POSTPONED" className="rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                                Postponed
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Clear Filters Button */}
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    onClick={clearFilters}
                                    className="h-11 rounded-xl border-gray-300 hover:bg-gray-50 font-medium"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Quick Search Tips */}
                    <div className="border-t border-gray-200 pt-4">
                        <p className="text-xs text-gray-500 font-medium mb-2">Quick search tips:</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <User className="h-3 w-3" />
                                <span>Citizen names</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3" />
                                <span>Email addresses</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3" />
                                <span>Phone numbers</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Search className="h-3 w-3" />
                                <span>Appointment purposes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}