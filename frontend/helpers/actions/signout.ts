"use server"

import { redirect } from "next/navigation";
import { getSession } from "./getsession";


export async function Signout(){
  const session = await getSession()
session.destroy();
  redirect("/Signin")
}
