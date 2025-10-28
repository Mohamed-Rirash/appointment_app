import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowLeft, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { client } from "@/helpers/api/client";
import { getSession } from "@/helpers/actions/getsession";

// Define the Office interface
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
  const session = await getSession();
  const token = session?.user.access_token;
  const { id } = await params;
  if (!token) {
    throw new Error("Unauthorized");
  }

  let office: Office;
  try {
    office = await client.getOffice(token, id);
  } catch (error) {
    notFound();
  }

  

  return (
    <main className="mx-6 my-8">
      {/* Back button */}
      <Link href="/offices">
        <Button
          variant="ghost"
          className="mb-4 pl-0 rounded-[4px] hover:bg-brand-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offices
        </Button>
      </Link>

      {/* Office Details */}
      <div className="">
        <div className="border border-[#eeeeee] rounded-[4px] shadow-gren p-6">
          {/* Header */}
          <div className="">
            <h1 className="text-[32px] font-bold text-brand-black">
              {office.name}
            </h1>
            <p className="text-2xl font-medium leading-7 text-brand-gray  mt-1 mb-2 max-w-[455px] w-full">
              {office.description}
            </p>
            <div className="flex items-center justify-between text-sm text-brand-gray mt-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-[16px] text-brand-gray font-normal">
                  <MapPin className="h-4 w-4" />
                  {office.location}
                </span>
                <Badge
                  className={`
                    py-2
                    px-4 rounded-full font-bold text-[14px]
                    ${
                      office.is_active
                        ? "bg-brand-primary text-brand"
                        : "bg-[#FDE7E7] text-[#F00F0F]"
                    }
                  `}
                >
                  {office.is_active ? "active" : "inactive"}
                </Badge>
              </div>
            </div>
          </div>

          {/* members */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-lg text-brand-black">
                Office Members
              </h1>
              <Button className="rounded-full w-12 h-12 combined-shadow-white bg-white hover:bg-white">
                <PlusIcon className="h-6! w-6! font-bold text-brand" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
