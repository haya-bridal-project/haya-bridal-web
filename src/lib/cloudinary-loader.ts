import type { ImageLoaderProps } from "next/image";

/**
 * next/image loader that asks Cloudinary for a resized, auto-format image.
 * Only Cloudinary delivery URLs are transformed; anything else is returned as-is.
 */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  const marker = "/image/upload/";
  const i = src.indexOf(marker);
  if (!src.startsWith("https://res.cloudinary.com/") || i === -1) return src;
  const transform = `f_auto,q_${quality ?? "auto"},c_limit,w_${width}`;
  return `${src.slice(0, i + marker.length)}${transform}/${src.slice(i + marker.length)}`;
}
