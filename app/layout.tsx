import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavigationProgressBar } from "@/components/NavigationProgressBar";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://coding-dashboard-two.vercel.app").replace(/\/$/, "");
const DESCRIPTION =
  "Track your Codeforces, LeetCode and CodeChef progress in one dashboard, practise timed mock interviews with a real code runner, and get AI code reviews.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "DashCode | Competitive Programming Dashboard & Interview Prep",
    template: "%s | DashCode",
  },
  description: DESCRIPTION,
  applicationName: "DashCode",
  keywords: ["competitive programming", "LeetCode tracker", "Codeforces", "CodeChef", "interview prep", "Blind 75", "mock interview"],
  openGraph: {
    type: "website",
    siteName: "DashCode",
    title: "DashCode | Competitive Programming Dashboard & Interview Prep",
    description: DESCRIPTION,
    url: APP_URL,
  },
  twitter: {
    card: "summary",
    title: "DashCode | Competitive Programming Dashboard & Interview Prep",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#090D1A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#090D1A] text-white">
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
