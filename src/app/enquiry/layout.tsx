import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Bridal Styling Enquiry & Custom Orders",
  description:
    "Submit a styling inquiry or custom bridal lehenga fitting request to Haya Bridal Couture. Personal assistance across Kerala & India.",
  path: "/enquiry",
});

export default function EnquiryLayout({ children }: { children: React.ReactNode }) {
  return children;
}

