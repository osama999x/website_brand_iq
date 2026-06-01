"use client";

import { useEffect, useState } from "react";
import { PLACEHOLDER_PRODUCT_IMAGE } from "../lib/assets";

export type ProductMediaFit = "contain" | "cover";

interface ProductMediaProps {
  src: string;
  alt: string;
  /** `cover` = fills frame, no letterboxing; `contain` = full image with possible gaps */
  fit?: ProductMediaFit;
  priority?: boolean;
  className?: string;
}

/**
 * Product photos via native img so object-fit is reliable (next/image fill often stretches).
 */
export default function ProductMedia({
  src,
  alt,
  fit = "cover",
  priority = false,
  className = "",
}: ProductMediaProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  const objectFit = fit === "cover" ? "cover" : "contain";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={`product-media-image product-media-image--${fit} ${className}`.trim()}
      style={{
        objectFit,
        objectPosition: "center",
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
      onError={() => {
        if (currentSrc !== PLACEHOLDER_PRODUCT_IMAGE) {
          setCurrentSrc(PLACEHOLDER_PRODUCT_IMAGE);
        }
      }}
    />
  );
}
