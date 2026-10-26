import Link from "next/link";
import Image from "next/image";

interface HayaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light"; // "dark" = for ivory/white backgrounds, "light" = for black/dark splash backgrounds
  customLogoUrl?: string | null;
  href?: string;
}

export function HayaLogo({
  className = "",
  size = "md",
  variant = "dark",
  customLogoUrl,
  href = "/",
}: HayaLogoProps) {
  const isLight = variant === "light";
  const logoSrc = customLogoUrl || "/haya-logo-transparent.png";

  // Aspect ratio of haya-logo-transparent.png is 638 x 947 (~0.674 width-to-height)
  const sizeMap = {
    sm: { height: 44, width: 30 },
    md: { height: 58, width: 39 },
    lg: { height: 84, width: 56 },
    xl: { height: 150, width: 101 },
  };

  const { height, width } = sizeMap[size];

  const content = (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div
        className={`relative transition-transform duration-300 group-hover:scale-105 shrink-0 ${
          isLight ? "brightness-0 invert" : ""
        }`}
        style={{ width, height }}
      >
        <Image
          src={logoSrc}
          alt="Haya Premium Bridal Rental"
          fill
          priority={size === "xl" || size === "md"}
          className="object-contain"
          sizes={`${width * 2}px`}
        />
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="group inline-flex items-center focus:outline-hidden"
      aria-label="Haya Premium Bridal Rental Home"
    >
      {content}
    </Link>
  );
}
