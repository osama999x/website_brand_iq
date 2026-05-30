"use client";

import { useMemo, useState } from "react";
import ProductMedia from "./ProductMedia";
import { PLACEHOLDER_PRODUCT_IMAGE, resolveProductImageUrl } from "../lib/assets";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const resolvedImages = useMemo(() => {
    const list = images.map((src) => resolveProductImageUrl(src));
    const usable = list.filter((url) => url !== PLACEHOLDER_PRODUCT_IMAGE);
    return usable.length > 0 ? usable : [PLACEHOLDER_PRODUCT_IMAGE];
  }, [images]);

  const safeIndex = Math.min(activeIndex, Math.max(0, resolvedImages.length - 1));

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-24">
      {/* Main image */}
      <div className="relative w-full aspect-square max-h-[min(85vh,720px)] overflow-hidden bg-neutral-100">
        <ProductMedia
          key={safeIndex}
          src={resolvedImages[safeIndex]}
          alt={`${productName} — view ${safeIndex + 1}`}
          priority
          className="product-media-image transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails row */}
      {resolvedImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {resolvedImages.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative aspect-square overflow-hidden bg-neutral-100 cursor-pointer transition-all duration-200 ${
                i === safeIndex
                  ? "ring-2 ring-neutral-900 ring-offset-1"
                  : "ring-1 ring-neutral-200 hover:ring-neutral-400"
              }`}
            >
              <ProductMedia
                src={src}
                alt={`${productName} thumbnail ${i + 1}`}
                className="product-media-image"
                sizes="15vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
