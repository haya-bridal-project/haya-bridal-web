import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Haya Bridal Concierge",
  description:
    "Reach the Haya Bridal Couture concierge for bespoke tailoring questions, custom bridal ornament inquiries, and pan-India order support.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

