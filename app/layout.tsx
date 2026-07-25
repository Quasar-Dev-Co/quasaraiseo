import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/hooks/use-auth";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuasarAISEO — Win visibility across search and AI answers",
  description:
    "QuasarAISEO turns one website into a scalable growth system with technical audits, programmatic landing pages, semantic content, schema, keyword intelligence, and AI search visibility optimization.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/mainlogos/mainlogo.png",
    shortcut: "/mainlogos/mainlogo.png",
    apple: "/mainlogos/mainlogo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuasarAISEO",
  },
};

export const viewport: Viewport = {
  themeColor: "#d946ef",
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
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
