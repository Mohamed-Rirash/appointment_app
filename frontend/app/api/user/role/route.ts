import { getSession } from "@/helpers/actions/getsession";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  const role = session?.user?.roles?.[0] || "";

  return NextResponse.json({ role });
}
