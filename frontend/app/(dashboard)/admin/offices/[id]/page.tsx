import { redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/helpers/actions/getsession";
import OfficeMembersSection from "./_components/OfficeMembersSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Office Details - KulanDesk",
  description: "Manage office members and assignments",
};

async function getOfficeDetails(id: string, token: string) {
  try {
    const res = await fetch(
      `${process.env.API_URL}/offices/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error("Failed to fetch office");
    return await res.json();
  } catch (error) {
    console.error("Office fetch error:", error);
    return null;
  }
}

export default async function OfficeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.access_token) redirect("/Signin");

  const token = session.user.access_token;
  const { id } = await params;
  const office = await getOfficeDetails(id, token);
  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link href="/admin/offices">
            <Button variant="ghost" className="pl-0 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Offices
            </Button>
          </Link>

          {office && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{office.name}</h1>
                <p className="text-gray-600 mt-1">{office.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="secondary" className={
                    office.is_active
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-50 text-gray-600"
                  }>
                    {office.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline" className="text-gray-700">
                    <Building2 className="h-3 w-3 mr-1" />
                    {office.location}
                  </Badge>
                </div>
              </div>

            </div>
          )}
        </div>
        {/* Members Section */}
        <OfficeMembersSection officeId={id} token={token} />
      </div>
    </div>
  );
}