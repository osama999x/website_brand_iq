import Image from "next/image";

interface ProductMediaProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Renders product photos from CDN paths or inline base64 (home/list API thumbnails).
 * Uses a native img for data: URLs — next/image is unreliable with large base64 payloads.
 */
export default function ProductMedia({
  src,
  alt,
  sizes = "(max-width: 640px) 100vw, 25vw",
  priority = false,
  className = "product-media-image",
}: ProductMediaProps) {
  if (src.startsWith("data:image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`absolute inset-0 h-full w-full ${className}`} />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}
