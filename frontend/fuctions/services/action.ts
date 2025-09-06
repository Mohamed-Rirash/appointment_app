"use server";
import { InvalidLoginError, signIn } from "@/auth";

export async function authenticate(email: string, password: string) {
  try {
    const r = await signIn("credentials", {
      email,
      password,
      redirect: false,
      // redirectTo: "/",
    });
    return { message: "success" }; // success case
  } catch (error) {
    if (error instanceof InvalidLoginError) {
      // unwrap and return only the message
      return { error: error.message };
    }
    console.error("Unexpected error", error);
    return { error: "Something went wrong. Please try again." };
  }
}
