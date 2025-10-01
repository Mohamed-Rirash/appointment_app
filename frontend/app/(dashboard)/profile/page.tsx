// app/profile/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserProfileClient from "./_components/UserProfileClient";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <div className="w-full bg-amber-900">
        <UserProfileClient user={session.user} />
      </div>
    </>
  );
}
