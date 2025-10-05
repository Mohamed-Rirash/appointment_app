import { requireAuth } from "@/helpers/auth-guard";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const user = await requireAuth(); 

  return <NavbarClient user={user} />;
}
