import { SessionOptions } from "iron-session";

export type UserSession = {
  // keep minimal and safe
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_verified: boolean;
  is_system_user: boolean;
  roles: string[];
  created_at: string;
  access_token?: string;
  // expires unix timestamp (seconds)
  expires_at?: number;
  office_id: string;
  position: string;
};

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD as string,
  cookieName: process.env.IRON_SESSION_COOKIE_NAME || "app_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // or 'strict' depending on needs
    httpOnly: true,
    path: "/",
  },
};

// helper type for Request handlers
declare module "iron-session" {
  interface IronSessionData {
    user?: UserSession;
  }
}
