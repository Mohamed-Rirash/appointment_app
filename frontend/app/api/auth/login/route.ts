import { getIronSession, IronSession } from "iron-session";
import { sessionOptions, type UserSession } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const loginData = new URLSearchParams({
      grant_type: 'password',
      username: email,
      password: password
    }).toString();

    const loginRes = await fetch(`${process.env.API_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: loginData, // Fixed: Added missing body
    });

    if (!loginRes.ok) {
      const errorData = await loginRes.json().catch(() => ({ detail: "Invalid credentials" }));
      return NextResponse.json(
        { error: errorData.detail || "Invalid credentials" },
        { status: loginRes.status }
      );
    }

    const data = await loginRes.json();
    const token = data.access_token;

    if (!token) {
      return NextResponse.json(
        { error: "No access token received" },
        { status: 500 }
      );
    }

    const userRes = await fetch(`${process.env.API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!userRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: userRes.status }
      );
    }

    const user = await userRes.json();

    if (!user.id || !user.email) {
      return NextResponse.json(
        { error: "Invalid user data received" },
        { status: 500 }
      );
    }

    const jwtSession: UserSession = {
      id: user.id,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active ?? false,
      is_verified: user.is_verified ?? false,
      is_system_user: user.is_system_user ?? false,
      roles: user.roles || [],
      access_token: token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      office_id: user.office_id || '', // Fixed: Changed null to empty string
      position: user.position || '',
    };

    const nextRes = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      }
    });
    
  const session = (await getIronSession(
      req,
      nextRes,
      sessionOptions
    )) as IronSession<{ user: UserSession }>;
    session.user = jwtSession;
    await session.save();

    return nextRes;

  } catch (error: any) {
    console.error("Login error:", error);

    let errorMessage = "Login failed. Please try again.";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = "Request timeout. Please try again.";
        statusCode = 408;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage }, 
      { status: statusCode }
    );
  }
}