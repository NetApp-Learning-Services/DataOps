import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";
// Vercel caching does some weird things
export const fetchCache = "force-no-store";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chatter",
  description: "Chat with your docs privately",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
