import "server-only";
import type { Metadata } from "next";

export const PRODUCTION_SITE_URL = "https://www.hayabridal.in";
export const GOOGLE_SITE_VERIFICATION = "z1ksj-bJSWyltlDZ0ASI0ihoMjMr3jbIkCVonAmlm70";
export const DEFAULT_OG_IMAGE = "/og-image.png";

export function getCanonicalSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && !configured.includes("localhost") && !configured.includes("127.0.0.1")) {
    return configured.replace(/\/$/, "");
  }
  return PRODUCTION_SITE_URL;
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const urlPath = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const ogImage = input.image || DEFAULT_OG_IMAGE;

  return {
    title: input.title,
    description: input.description,
    ...(input.keywords?.length ? { keywords: input.keywords } : {}),
    alternates: {
      canonical: urlPath,
    },
    openGraph: {
      title: `${input.title} | Haya Bridal`,
      description: input.description,
      url: urlPath,
      siteName: "Haya Bridal",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${input.title} — Haya Bridal Couture & Fine Ornaments`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} | Haya Bridal`,
      description: input.description,
      images: [ogImage],
    },
    ...(input.noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

