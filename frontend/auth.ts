import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { client } from "./lib/api/client";

export class InvalidLoginError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.message = message;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // credentials: {
      //   email: { label: "email" },
      //   password: { label: "Password", type: "password" },
      // },
      async authorize(credentials, ) {
        // Replace with your backend call
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        console.log("FRom Credentaila", credentials);

        try {
          const response = await client.Login(email, password);
          const data = await response.json();

          if (!response.ok) throw new InvalidLoginError(data.detail);

          return {
            access_token: data.access_token,
            expires_at: Math.floor(Date.now() / 1000 + data.expires_in),
          };
        } catch (error: any) {
          throw new InvalidLoginError(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("token", token);
      console.log("user", user);
    },
  },
  pages: {
    signIn: "/signin",
  },
});
