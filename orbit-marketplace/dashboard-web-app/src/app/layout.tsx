/**
 * ⚪ APP ENTRY | Root Layout
 * 
 * Root HTML layout with Geist fonts, dark mode, and Sonner toast provider.
 * Sets up global styles, metadata, and favicon.
 * 
 * Used by: Next.js App Router (automatic)
 * Category: App Entry
 */

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbit — Professional Cinema. Delivered in 60 Minutes.",
  description:
    "Desktop-grade professional edits within 60-120 minutes. The Orbit Edge: Fluidity & Precision — using professional human editors at the speed of AI.",
  keywords: [
    "Orbit",
    "Cinema",
    "Video Editing",
    "Professional Reels",
    "UGC",
    "On-Demand",
  ],
  authors: [{ name: "Orbit Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/orbit-logo.png",
    apple: "/orbit-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Orbit",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/orbit-logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/orbit-logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Orbit" />
        <meta name="apple-mobile-web-app-title" content="Orbit" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-navbutton-color" content="#000000" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0A0A0A",
              border: "1px solid #1A1A2E",
              color: "#FFFFFF",
            },
          }}
        />
      </body>
    </html>
  );
}
