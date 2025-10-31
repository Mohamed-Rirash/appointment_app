import { getSession } from "@/helpers/actions/getsession";
import { redirect } from "next/navigation";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const session = await getSession()
  if (!session.user) {
    redirect("/Signin")
  }

  return <NavbarClient user={session?.user} />;
}
