"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-24">
      {/* Main image */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-100">
        <Image
          key={activeIndex}
          src={images[activeIndex]}
          alt={`${productName} — view ${activeIndex + 1}`}
          fill
          priority
          className="product-media-image transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative aspect-[3/4] overflow-hidden bg-neutral-100 cursor-pointer transition-all duration-200 ${
                i === activeIndex
                  ? "ring-2 ring-neutral-900 ring-offset-1"
                  : "ring-1 ring-neutral-200 hover:ring-neutral-400"
              }`}
            >
              <Image
                src={src}
                alt={`${productName} thumbnail ${i + 1}`}
                fill
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
