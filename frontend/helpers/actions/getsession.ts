"use server";

import { sessionOptions, UserSession } from "@/auth";
import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export async function getSession() {
  const session = (await getIronSession(
    await cookies(),
    sessionOptions
  )) as IronSession<{ user: UserSession }>;
  return session;
}
