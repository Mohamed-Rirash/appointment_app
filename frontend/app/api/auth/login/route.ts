import { getIronSession, type IronSession } from "iron-session";
import { sessionOptions, type UserSession } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;
  console.log("for it", email, password)

  
  const res = await fetch(`${process.env.API_URL}/users/login`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=password&username=${email}&password=${password}`,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Login failed" }));
    return NextResponse.json({ error: err.message }, { status: 401 });
  }

  const data = await res.json();
  const token = data.access_token;

  const apiResponse = await fetch(`${process.env.API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const user = await apiResponse.json();

  const jwtSession: UserSession = {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    is_active: user.is_active,
    is_verified: user.is_verified,
    is_system_user: user.is_system_user,
    roles: user.roles,
    access_token: data.access_token,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
  };

  const nextRes = NextResponse.json({ ok: true });
  const session = (await getIronSession(req, nextRes, sessionOptions)) as IronSession<{ user: UserSession }>;

  session.user = jwtSession;
  await session.save();

  return nextRes;
}
