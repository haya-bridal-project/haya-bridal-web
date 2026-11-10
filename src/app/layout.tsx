import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import {
  DEFAULT_OG_IMAGE,
  GOOGLE_SITE_VERIFICATION,
  getCanonicalSiteUrl,
} from "@/lib/seo";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = getCanonicalSiteUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF6F0",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Haya Bridal — Bespoke Bridal Couture, Lehengas & Fine Ornaments",
    template: "%s | Haya Bridal",
  },
  description:
    "Discover handcrafted bridal lehengas, custom-tailored wedding dresses, and heritage bridal jewellery ornaments at Haya Bridal. Secure online checkout and insured pan-India delivery.",
  applicationName: "Haya Bridal",
  keywords: [
    "Haya Bridal",
    "Haya Bridal Couture",
    "bridal lehenga",
    "bespoke bridal dresses",
    "custom wedding lehenga India",
    "bridal jewellery Kerala",
    "bridal ornaments",
    "kundan bridal choker",
    "temple jewellery bridal",
    "wedding couture boutique India",
  ],
  authors: [{ name: "Haya Bridal", url: siteUrl }],
  creator: "Haya Bridal",
  publisher: "Haya Bridal",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    title: "Haya Bridal — Bespoke Bridal Couture, Lehengas & Fine Ornaments",
    description:
      "Handcrafted bespoke bridal dresses, wedding lehengas, and heritage fine ornaments with pan-India insured delivery.",
    url: siteUrl,
    siteName: "Haya Bridal",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Haya Bridal Couture & Fine Ornaments",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Haya Bridal — Bespoke Bridal Couture & Fine Ornaments",
    description:
      "Handcrafted bespoke bridal dresses, wedding lehengas, and heritage fine ornaments with pan-India insured delivery.",
    images: [DEFAULT_OG_IMAGE],
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${cormorant.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("haya_splash_shown")){document.documentElement.classList.add("haya-splash-done")}}catch(e){}`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#FAF6F0] text-[#2B211C] font-sans selection:bg-[#B06F5E] selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
