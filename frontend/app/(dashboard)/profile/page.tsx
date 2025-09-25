// app/profile/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserProfileClient from "./_components/UserProfileClient";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <UserProfileClient user={session.user} />;
}
