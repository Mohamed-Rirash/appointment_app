import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Home() {
  // if (!user) return redirect("/Signin");
  const session = await auth();

  if (!session?.user) {
    console.log("No session", session?.user);
    return redirect("/Signin");
  }

  console.log("Session", session?.user);

  return (
    <>
      <div className="ml-6">
        <h1>Hello {session?.user?.email}</h1>
        <p>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Amet quam
          accusamus ullam dignissimos ut fugit quidem voluptates, similique
          labore, sit adipisci assumenda excepturi temporibus? Esse nam
          veritatis iste sequi adipisci.
        </p>
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <Button type="submit">Sign Out</Button>
        </form>
      </div>
    </>
  );
}
