"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, ArrowLeftRight, CheckCircle, LocateIcon } from "lucide-react";
import { useOffices } from "@/hooks/office/useOffices";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { EditOffice } from "./EditOffice";
import { DeleteOffice } from "./DeleteOffice";
import { DeactivateOfficeButton } from "./DeactivateOfficeButton";
import { ActivateOfficeButton } from "./ActivateOfficeButton";


export interface Office {
  id: string;
  name: string;
  description: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export default function OfficeTable({ token }: { token?: string }) {
  const { offices, isLoading } = useOffices(token);


  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-64" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="rounded-[4px] shadow-gren border border-[#eeeeee] overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F5F5F5] border-b border-[#eeeeee]">
            <TableHead className="px-4 py-3 font-medium text-brand-gray">Name</TableHead>
            <TableHead className="px-4 py-3 font-medium text-brand-gray">Description</TableHead>
            <TableHead className="px-4 py-3 font-medium text-brand-gray">Location</TableHead>
            <TableHead className="px-4 py-3 font-medium text-brand-gray">Status</TableHead>
            <TableHead className="px-4 py-3 font-medium text-brand-gray">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offices.map((office: Office) => (
            <TableRow key={office.id} className="border-t border-[#eeeeee] hover:bg-gray-50">
              <TableCell className="px-4 py-3 font-medium text-brand-black">{office.name}</TableCell>
              <TableCell className="px-4 py-3  text-brand-gray">{office.description}</TableCell>
              <TableCell className="px-4 py-3">{office.location}</TableCell>
              <TableCell className="px-4 py-3">
                <Badge
                  className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${office.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  `}
                >
                  {office.is_active ? "active" : "inactive"}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex gap-2 items-center">
                  {/* View */}
                  <Link href={`/offices/${office.id}`} className="text-brand hover:text-green-600 flex items-center gap-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>

                  {/* Edit Button */}
                  <EditOffice token={token} initialData={office} />
                  {/* Delete */}
                  <DeleteOffice officeId={office.id} token={token} />
                  {/* Deactivate / Activate */}
                  {office.is_active ? (
                    <DeactivateOfficeButton officeId={office.id} token={token} />
                  ) : (
                    <ActivateOfficeButton officeId={office.id} token={token} />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>


    </div>
  );
}