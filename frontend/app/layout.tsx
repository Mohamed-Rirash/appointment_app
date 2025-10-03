import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Provider from "@/fuctions/Provider";

const satoshi = localFont({
  src: [
    {
      path: "../public/font/Satoshi/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/font/Satoshi/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/font/Satoshi/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-satoshi", // CSS variable for Tailwind
});

export const metadata: Metadata = {
  title: "Kullan Desk",
  description: "full appointment booking system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={satoshi.variable}>
      <body>
        <Provider>
          <SessionProvider>{children} </SessionProvider>
        </Provider>
      </body>
    </html>
  );
}
