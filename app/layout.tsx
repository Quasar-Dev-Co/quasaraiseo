import type { Metadata } from "next";
import { Manrope, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import React from "react";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "QuasarAISEO Audit Studio",
  description: "AI-Powered SEO Audits to analyze and crawl your website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${dmSerifDisplay.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex bg-quas-bg dark:bg-quas-navy text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Providers>
          <div className="flex w-full min-h-screen">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Application area */}
            <div className="flex flex-col flex-1 min-w-0 lg:pl-[238px]">
              {/* Header Topbar */}
              <Topbar />

              {/* Page Contents */}
              <main className="flex-1 w-full">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
