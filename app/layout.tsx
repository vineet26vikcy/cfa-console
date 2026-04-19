import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"; // <-- 1. Import the package

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CFA_CONSOLE",
  description: "Dynamic Spaced Repetition Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <SpeedInsights /> {/* <-- 2. Drop the component here */}
      </body>
    </html>
  );
}