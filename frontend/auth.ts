import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { client } from "./fuctions/api/client";

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    emailVerified?: Date | null;
    roles: string[];
    permissions: string[];
    access_token: string;
    expires_at: number;
  }

  interface Session {
    access_token: string;
    error?: string;
  }
}

export class InvalidLoginError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.message = message;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        try {
          // Login → returns tokens
          const response = await client.Login(email, password);
          const data = await response.json();
          if (!response.ok) {
            console.log("Auuuht", data);
          }

          if (!response.ok) throw new InvalidLoginError(data.detail);

          // Fetch user profile with access_token
          const userRes = await client.GetUser(data.access_token);
          const user = await userRes.json();
          console.log("User", user);
          return {
            ...user,
            access_token: data.access_token,
            expires_at: Math.floor(Date.now() / 1000 + data.expires_in), // expiry in seconds
          };
        } catch (error: any) {
          throw new InvalidLoginError(error.message);
        }
      },
    }),
  ],

  callbacks: {
    // Runs whenever token is created/updated
    async jwt({ token, user }) {
      // Initial login → attach tokens + user info
      console.log("Usershit", user);
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
          access_token: user.access_token,
          expires_at: user.expires_at,
        };
      }

      // If token still valid → return it
      if (Date.now() < (token.expires_at as number) * 1000) {
        return token;
      }
      // signOut();
      // Otherwise refresh
      const refreshed = await client.refreshAccessToken();

      if (refreshed.error) {
        return { ...token, error: "RefreshAccessTokenError" };
      }

      return {
        ...token,
        access_token: refreshed.access_token,
        expires_at: refreshed.expires_at,
      };
    },

    // What's sent to the client (session)
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        emailVerified: null,
        roles: token.roles as string[],
        permissions: token.permissions as string[],
        access_token: token.access_token as string,
        expires_at: token.expires_at as number,
      };

      session.access_token = token.access_token as string;
      session.error = token.error as string | undefined;

      return session;
    },
  },

  pages: {
    signIn: "/signin",
  },
});
