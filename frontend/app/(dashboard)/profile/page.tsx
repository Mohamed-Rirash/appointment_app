
import { getSession } from "@/helpers/actions/getsession";
import { redirect } from "next/navigation";
import UserProfileClient from "./_components/UserProfileClient";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/Signin");
  }
  console.log("profile", session?.user.first_name)
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-4xl px-4">
        <UserProfileClient user={session.user} />
      </div>
    </div>
  );
}