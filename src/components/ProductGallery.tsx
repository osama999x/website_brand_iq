"use client";

import { useMemo, useState } from "react";
import ProductMedia from "./ProductMedia";
import { PLACEHOLDER_PRODUCT_IMAGE, resolveProductImageUrl } from "../lib/assets";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  /** Apparel turns like a lookbook page. Beauty turns further, like a bottle or compact. */
  presentation?: "apparel" | "beauty";
}

export default function ProductGallery({ images, productName, presentation = "apparel" }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [turn, setTurn] = useState<"next" | "prev">("next");
  const beauty = presentation === "beauty";

  const resolvedImages = useMemo(() => {
    const list = images.map((src) => resolveProductImageUrl(src));
    const usable = list.filter((url) => url !== PLACEHOLDER_PRODUCT_IMAGE);
    return usable.length > 0 ? usable : [PLACEHOLDER_PRODUCT_IMAGE];
  }, [images]);

  const safeIndex = Math.min(activeIndex, Math.max(0, resolvedImages.length - 1));

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-24">
      {/* Main image */}
      <div
        className={`product-media-frame relative w-full max-h-[min(90vh,800px)] ${
          beauty ? "aspect-[4/5] bg-[#f4efe9]" : "aspect-[3/4]"
        }`}
        style={{ perspective: "1000px" }}
      >
        <ProductMedia
          key={`${safeIndex}-${turn}`}
          src={resolvedImages[safeIndex]}
          alt={`${productName} — view ${safeIndex + 1}`}
          priority
          fit="cover"
          className={`media-turn-3d${beauty ? " media-turn-3d--beauty" : ""}${
            turn === "prev" ? " media-turn-3d--prev" : ""
          }`}
        />
      </div>

      {/* Thumbnails row */}
      {resolvedImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {resolvedImages.map((src, i) => (
            <button
              key={i}
              onClick={() => {
                setTurn(i < safeIndex ? "prev" : "next");
                setActiveIndex(i);
              }}
              aria-label={`View image ${i + 1}`}
              className={`product-media-frame relative cursor-pointer transition-all duration-200 ${
                beauty ? "aspect-[4/5] bg-[#f4efe9]" : "aspect-[3/4]"
              } ${
                i === safeIndex
                  ? "ring-2 ring-neutral-900 ring-offset-1"
                  : "ring-1 ring-neutral-200 hover:ring-neutral-400"
              }`}
            >
              <ProductMedia
                src={src}
                alt={`${productName} thumbnail ${i + 1}`}
                fit="cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
