import { getSession } from "@/helpers/actions/getsession";
import { redirect } from "next/navigation";
import UserProfileClient from "./_components/UserProfileClient";


export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/Signin");
  }

  return (
    <>
      <div className="">
        <UserProfileClient user={session.user} />
      </div>
    </>
  );
}
