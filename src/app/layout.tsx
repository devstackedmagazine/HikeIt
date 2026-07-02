import "./globals.css";

import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { CookieConsent } from "@/components/shared/cookie-consent";
import { PwaInstallPrompt } from "@/components/shared/pwa-install-prompt";

const sora = Sora({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-sora",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      className={`${sora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NuqsAdapter>{children}</NuqsAdapter>
        <CookieConsent />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
