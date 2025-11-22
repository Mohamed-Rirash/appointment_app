
import { getSession } from "@/helpers/actions/getsession";
import { redirect } from "next/navigation";
import UserProfileClient from "./_components/UserProfileClient";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.user || !session.user.access_token) {
    redirect("/Signin");
  }
  console.log("profile", session?.user)

  const user = {
    email: session.user.email,
    first_name: session.user.first_name,
    last_name: session.user.last_name,
    is_active: session.user.is_active,
    is_verified: session.user.is_verified,
    created_at: session.user.created_at,
    roles: session.user.roles,
    access_token: session.user.access_token,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-4xl px-4">
        <UserProfileClient user={user} />
      </div>
    </div>
  );
}