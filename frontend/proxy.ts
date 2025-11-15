// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { getSession } from "./helpers/actions/getsession";

// export async function proxy(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   const session = await getSession();

//   if (!session && !pathname.startsWith("/Signin")) {
//     return NextResponse.redirect(new URL("/Signin", request.url));
//   }

//   let role: string | null = null;
//   try {
//     role = session?.user.roles[0];
//   } catch {
//     role = null;
//   }

//   if (pathname === "/") {
//     if (role === "admin") {
//       return NextResponse.next();
//     } else if (role === "host" || role === "secretary") {
//       return NextResponse.redirect(new URL("/host", request.url));
//     } else if (role === "reception") {
//       return NextResponse.redirect(new URL("/reception", request.url));
//     } else {
//       return NextResponse.redirect(new URL("/Signin", request.url));
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/", "/Signin", "/host/:path*", "/reception/:path*"],
// };

// proxy.ts (project root)
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./helpers/actions/getsession";

// Route configuration
const PUBLIC_ROUTES = ["/Sgnin", "/forget-password", "/set-password", "/unauthorized"];
const PROTECTED_ROUTES = ["/admin", "/reception", "/host"];
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["/admin"],
  reception: ["/reception"],
  host: ["/host", "/admin/visitors"],
  secretary: ["/host"],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Protect routes and check roles
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next();
    const session = await getSession()
    
    if (!session.user) {
      return NextResponse.redirect(new URL("/Signin", req.url));
    }

    const userRole = session.user.roles?.[0];
    if (!checkRoleAccess(pathname, userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return response;
  }

  // 3. Handle root path with role-based redirects
  if (pathname === "/") {
    const response = NextResponse.next();
    const session = await getSession()
    
    if (!session.user) {
      return NextResponse.redirect(new URL("/Signin", req.url));
    }

    return NextResponse.redirect(
      new URL(getDashboardUrl(session.user.roles?.[0]), req.url)
    );
  }

  return NextResponse.next();
}

// Helper: Check role-based access
function checkRoleAccess(path: string, role?: string): boolean {
  if (!role) return false;
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.some(p => path.startsWith(p));
}

// Helper: Get dashboard URL for role
function getDashboardUrl(role?: string): string {
  const urls: Record<string, string> = {
    admin: "/admin",
    reception: "/reception",
    host: "/host",
    secretary: "/host",
  };
  return urls[role || ""] || "/Signin";
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};