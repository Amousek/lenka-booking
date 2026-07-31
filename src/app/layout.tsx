import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Lenka – Rezervace",
  description: "Rezervuj si čas s Lenkou",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body
        className={`${inter.className} antialiased bg-gradient-to-br from-rose-50 via-white to-purple-50 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
