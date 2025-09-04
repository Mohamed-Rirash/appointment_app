import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { redirect } from "next/navigation";

export default function Home() {
  const user = false;

  if (!user) return redirect("/Signin");
  return <h1>Hello </h1>;
}
