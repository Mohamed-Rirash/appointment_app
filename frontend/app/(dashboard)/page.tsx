import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Sidebar() {
  return (
    <>
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-5xl font-bold text-purple-500 mb-4">
          Hello, How are you doing?
        </h1>
        <p className="mb-6 text-gray-700">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. In architecto
          expedita, rerum corrupti provident sit rem minus similique tenetur.
          Suscipit ullam, amet nobis repellendus sapiente illo dolorum minima
          voluptas magni?
        </p>
        <Link href="/Signin">
          <Button className="bg-amber-600 hover:bg-amber-700">Log in</Button>
        </Link>
      </main>
    </>
  );
}
