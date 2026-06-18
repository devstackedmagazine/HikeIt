import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { CookieConsent } from "@/components/shared/cookie-consent";
import { PwaInstallPrompt } from "@/components/shared/pwa-install-prompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hikeit.app"),
  title: {
    default: "HikeIt — Komuniteti i Alpinizmit në Kosovë",
    template: "%s · HikeIt",
  },
  description:
    "Gjej shtigje, bashkohu me klube dhe rezervo udhëtime malore në Kosovë dhe Ballkan.",
  appleWebApp: {
    capable: true,
    title: "HikeIt",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NuqsAdapter>{children}</NuqsAdapter>
        <CookieConsent />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
