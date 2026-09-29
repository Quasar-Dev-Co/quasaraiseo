import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/hooks/use-auth";
import { WorkspaceProvider } from "@/hooks/use-workspace";
import { Providers } from "@/components/Providers";

// IBM Plex: a working typeface with real character for a data-heavy tool
// (replaces Inter, which reads as generic).
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuasarAISEO — Win visibility across search and AI answers",
  description:
    "QuasarAISEO turns one website into a scalable growth system with technical audits, programmatic landing pages, semantic content, schema, keyword intelligence, and AI search visibility optimization.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/icon-32.png",
    apple: "/icon-apple.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuasarAISEO",
  },
};

export const viewport: Viewport = {
  themeColor: "#c2410c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <WorkspaceProvider>
            <Providers>{children}</Providers>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
