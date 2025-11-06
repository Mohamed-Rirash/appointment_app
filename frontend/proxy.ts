import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./helpers/actions/getsession";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await getSession();

  if (!session && !pathname.startsWith("/Signin")) {
    return NextResponse.redirect(new URL("/Signin", request.url));
  }

  let role: string | null = null;
  try {
    role = session?.user.roles[0];
  } catch {
    role = null;
  }

  if (pathname === "/") {
    if (role === "admin") {
      return NextResponse.next();
    } else if (role === "host" || role === "secretary") {
      return NextResponse.redirect(new URL("/host", request.url));
    } else if (role === "reception") {
      return NextResponse.redirect(new URL("/reception", request.url));
    } else {
      return NextResponse.redirect(new URL("/Signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/Signin", "/host/:path*", "/reception/:path*"],
};
