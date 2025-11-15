import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/helpers/actions/getsession";
import OfficeMembersSection from "./_components/OfficeMembersSection";


interface Office {
  id: string;
  name: string;
  description: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default async function OfficeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await getSession();
  const token = user?.access_token;
  const { id } = await params;




  return (
    <main className="mx-6 my-6">
      <Link href="/admin/offices">
        <Button
          variant="ghost"
          className="mb-4 pl-0 rounded-sm hover:bg-brand-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offices
        </Button>
      </Link>

      <main className="mx-6 mt-8">
        <OfficeMembersSection officeId={id} token={token} />
      </main>
    </main>
  );
}
