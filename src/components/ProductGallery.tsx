"use client";

import { useMemo, useRef, useState } from "react";
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
  const frameRef = useRef<HTMLDivElement | null>(null);
  const beauty = presentation === "beauty";

  function tiltTo(e: React.PointerEvent<HTMLDivElement>) {
    const el = frameRef.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const max = beauty ? 9 : 6;
    el.style.transform = `rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
  }

  function resetTilt() {
    if (frameRef.current) frameRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  const resolvedImages = useMemo(() => {
    const list = images.map((src) => resolveProductImageUrl(src));
    const usable = list.filter((url) => url !== PLACEHOLDER_PRODUCT_IMAGE);
    return usable.length > 0 ? usable : [PLACEHOLDER_PRODUCT_IMAGE];
  }, [images]);

  const safeIndex = Math.min(activeIndex, Math.max(0, resolvedImages.length - 1));

  return (
    <div className="gallery-stage flex flex-col gap-3 lg:sticky lg:top-24">
      <div
        ref={frameRef}
        onPointerMove={tiltTo}
        onPointerLeave={resetTilt}
        className={`tilt-frame product-media-frame relative w-full max-h-[min(82vh,860px)] ${
          beauty ? "aspect-[4/5] bg-[#f4efe9]" : "aspect-[3/4]"
        }`}
      >
        <ProductMedia
          key={`${safeIndex}-${turn}`}
          src={resolvedImages[safeIndex]}
          alt={`${productName} — view ${safeIndex + 1}`}
          priority
          fit="cover"
          focus={beauty ? "center" : "top"}
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
              className={`thumb-3d product-media-frame relative cursor-pointer ${
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
                focus={beauty ? "center" : "top"}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
