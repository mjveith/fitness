import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/bottom-nav";
import { AppShell } from "@/components/app-shell";
import { InstallPrompt } from "@/components/install-prompt";
import { OfflineLogSync } from "@/components/offline-log-sync";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitness",
  description: "Mobile-first workout planning, logging, and exercise guidance.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fitness",
  },
  icons: {
    apple: "/icons/icon-192.svg",
    icon: [{ url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#050816",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <OfflineLogSync />
        <AppShell>
          <InstallPrompt />
          {children}
        </AppShell>
        <BottomNav />
      </body>
    </html>
  );
}
