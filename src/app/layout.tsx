import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { CookieConsent } from "@/components/shared/cookie-consent";
import { PwaInstallPrompt } from "@/components/shared/pwa-install-prompt";

const sora = Sora({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "HikeIt",
  url: "https://hikeit.app",
  logo: "https://hikeit.app/icon-512",
  description:
    "Platforma e alpinizmit dhe shtigjeve malore në Kosovë dhe Ballkan.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "XK",
    addressLocality: "Prishtinë",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@hikeit.app",
    contactType: "customer service",
  },
  sameAs: [
    "https://www.instagram.com/hikeit.app",
    "https://www.facebook.com/hikeit.app",
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://hikeit.app"),
  title: {
    default: "HikeIt — Shtigjet dhe Klubet e Alpinizmit në Kosovë",
    template: "%s · HikeIt",
  },
  description:
    "Zbulo shtigjet më të bukura të Kosovës dhe Ballkanit. Bashkohu me klube alpinizmi, rezervo udhëtime malore dhe eksploro natyrën e egër.",
  keywords: [
    "hiking Kosovo",
    "alpinizëm Kosovë",
    "shtigje malore Kosovë",
    "klube alpinizmi",
    "Rugova hiking",
    "Bjeshkët e Namuna",
    "Sharr mountains",
    "Kosovo trails",
    "hiking Balkans",
    "ecje malore",
    "udhëtime alpine",
  ],
  authors: [{ name: "HikeIt", url: "https://hikeit.app" }],
  creator: "HikeIt",
  publisher: "HikeIt",
  appleWebApp: {
    capable: true,
    title: "HikeIt",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "sq_AL",
    url: "https://hikeit.app",
    siteName: "HikeIt",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://hikeit.app",
  },
  verification: {
    google: "PQIIX3BsVYvYS4VfY4ubJaCTmnJ7j_gdqcxnAIajbB8",
  },
};

export const viewport: Viewport = {
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
    <html
      lang="sq"
      className={`${sora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        <NuqsAdapter>{children}</NuqsAdapter>
        <CookieConsent />
        <PwaInstallPrompt />
        <Analytics />
      </body>
    </html>
  );
}
