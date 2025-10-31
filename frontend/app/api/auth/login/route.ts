import { getIronSession, type IronSession } from "iron-session";
import { sessionOptions, type UserSession } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  try {
    // 1️⃣ Login request to backend
    const res = await axios.post(
      `${process.env.API_URL}/users/login`,
      `grant_type=password&username=${email}&password=${password}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // 2️⃣ Extract token data
    const data = res.data;
    const token = data.access_token;

    // 3️⃣ Fetch user info
    const apiResponse = await axios.get(`${process.env.API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = apiResponse.data;

    // 4️⃣ Prepare session payload
    const jwtSession: UserSession = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active,
      is_verified: user.is_verified,
      is_system_user: user.is_system_user,
      roles: user.roles,
      access_token: token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    };

    // 5️⃣ Save session with iron-session
    const nextRes = NextResponse.json({ success: true });
    const session = (await getIronSession(
      req,
      nextRes,
      sessionOptions
    )) as IronSession<{ user: UserSession }>;

    session.user = jwtSession;
    await session.save();

    return nextRes;
  } catch (error: any) {
    // 🧩 Better error handling
    const message =
      error.response?.data?.detail || "Login failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
