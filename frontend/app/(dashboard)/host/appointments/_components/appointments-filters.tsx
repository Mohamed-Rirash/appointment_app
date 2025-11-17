// components/appointments/appointments-filters.tsx
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
import { RefreshCw, Search, Filter, Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    const [localDate, setLocalDate] = useState(currentDate);

    // Sync local state with props
    useEffect(() => {
        setSearchInput(currentSearch);
        setLocalStatus(currentStatus);
        setLocalDate(currentDate);
    }, [currentSearch, currentStatus, currentDate]);

    const handleStatusChange = (status: string) => {
        setLocalStatus(status);
        onFilterChange({
            status,
            search: "" // Clear search when changing status
        });
    };

    const handleDateChange = (date: string) => {
        setLocalDate(date);
        onFilterChange({ date });
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

    const clearFilters = () => {
        setSearchInput("");
        setLocalStatus("all");
        setLocalDate("today");
        onFilterChange({
            status: "all",
            date: "today",
            search: "",
            page: "1"
        });
    };

    const hasActiveFilters = localStatus !== "all" || localDate !== "today" || currentSearch;
    const hasSearch = currentSearch && currentSearch.trim() !== "";

    return (
        <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by citizen name, email, phone, or purpose..."
                        className="pl-9 pr-9"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {searchInput && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Button
                    onClick={handleSearch}
                    className="gap-2 bg-brand hover:bg-brand/80"
                    disabled={!searchInput.trim()}
                >
                    <Search className="h-4 w-4" />
                    Search
                </Button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold">
                        {totalCount.toLocaleString()} Appointment{totalCount !== 1 ? 's' : ''}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        {hasSearch && (
                            <Badge variant="secondary" className="gap-1">
                                Search: "{currentSearch}"
                                <button onClick={clearSearch} className="hover:text-destructive">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {localStatus !== "all" && (
                            <Badge variant="outline" className="capitalize">
                                Status: {localStatus.toLowerCase()}
                            </Badge>
                        )}
                        {localDate !== "today" && (
                            <Badge variant="outline" className="capitalize">
                                Date: {localDate.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
                            </Badge>
                        )}
                        {!hasActiveFilters && (
                            <span className="text-sm text-muted-foreground">
                                Showing all appointments
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Date Filter */}
                    <Select value={localDate} onValueChange={handleDateChange}>
                        <SelectTrigger className="w-40">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Date range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="tomorrow">Tomorrow</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="all">All Dates</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={localStatus} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-40">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            <SelectItem value="NO_SHOW">No Show</SelectItem>
                            <SelectItem value="DENIED">Denied</SelectItem>
                            <SelectItem value="POSTPONED">Postponed</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} className="gap-2">
                            <X className="h-4 w-4" />
                            Clear All
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}