// lib/auth-guard.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/Signin");
  }
  return session.user;
}
