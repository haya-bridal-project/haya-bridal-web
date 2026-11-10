import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Haya Bridal — Bespoke Bridal Couture & Fine Ornaments",
    short_name: "Haya Bridal",
    description:
      "Handcrafted bespoke bridal dresses, wedding lehengas, and heritage fine bridal ornaments with insured pan-India delivery.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF6F0",
    theme_color: "#B06F5E",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

