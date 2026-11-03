"use client";

import Link from "next/link";
import ProductMedia from "./ProductMedia";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Product } from "../data/products";
import { resolveProductImageUrl } from "../lib/assets";
import { formatMoney, getPriceRange } from "../lib/pricing";
import { buildQuickAddCartLine } from "../lib/quickAddFromProduct";
import { isMongoObjectId } from "../lib/productVariantMaps";
import { getProductDetail } from "../services/homeService";
import { mapApiProductDetailToProduct } from "../types/api";
import { useCartStore } from "../store/cartStore";
import { isCosmeticsProduct } from "../lib/shopGender";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { name, fit, gender, price, compareAtPrice, image, images, isNew, slug, colors, category, categoryGender } = product;
  const beauty = gender === "Cosmetics" || isCosmeticsProduct({ category, categoryGender });
  const frameRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useRef(false);
  const priceRange = getPriceRange(product);
  const hasVariantRange = priceRange.min !== priceRange.max;
  const addToCart = useCartStore((s) => s.addToCart);
  const router = useRouter();
  const [quickState, setQuickState] = useState<"idle" | "loading" | "added">("idle");
  const addedTimer = useRef<number | null>(null);

  const primaryRaw = image || images?.[0];
  const imageSrc = resolveProductImageUrl(primaryRaw);
  const secondaryRaw = images?.find((src) => src && src !== primaryRaw);
  const secondarySrc = secondaryRaw ? resolveProductImageUrl(secondaryRaw) : null;
  const showSecondary = Boolean(secondarySrc && secondarySrc !== imageSrc);

  const onSale = !hasVariantRange && compareAtPrice != null && compareAtPrice > price;
  const salePct = onSale && compareAtPrice ? Math.round((1 - price / compareAtPrice) * 100) : 0;
  const swatches = (colors ?? []).filter((c) => c.hex).slice(0, 4);
  const extraColors = (colors?.length ?? 0) - swatches.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mq.matches;
    const onChange = () => {
      reducedMotion.current = mq.matches;
    };
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      if (addedTimer.current != null) window.clearTimeout(addedTimer.current);
    };
  }, []);

  function tiltTo(e: React.PointerEvent<HTMLDivElement>) {
    const el = frameRef.current;
    if (!el || reducedMotion.current || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const max = beauty ? 12 : 8;
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
  }

  function resetTilt() {
    const el = frameRef.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  }

  async function handleQuickAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (quickState === "loading") return;
    setQuickState("loading");
    try {
      let resolved: Product = product;
      if (isMongoObjectId(product.slug)) {
        try {
          const detail = await getProductDetail(product.slug);
          resolved = mapApiProductDetailToProduct(detail);
        } catch {
          setQuickState("idle");
          router.push(`/products/${product.slug}`);
          return;
        }
      }

      const line = buildQuickAddCartLine(resolved);
      if (!line) {
        setQuickState("idle");
        router.push(`/products/${product.slug}`);
        return;
      }
      addToCart(line);
      setQuickState("added");
      if (addedTimer.current != null) window.clearTimeout(addedTimer.current);
      addedTimer.current = window.setTimeout(() => setQuickState("idle"), 1400);
    } catch {
      setQuickState("idle");
    }
  }

  const quickLabel =
    quickState === "loading" ? "Adding…" : quickState === "added" ? "Added" : "Quick Add";

  const quickButtonClass = `w-full text-xs font-semibold tracking-[0.18em] uppercase py-3.5 cursor-pointer disabled:cursor-wait transition-colors duration-200 ${
    quickState === "added"
      ? "bg-neutral-800 text-white"
      : "bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-60"
  }`;

  return (
    <article
      className="reveal-card group flex flex-col"
      style={{ animationDelay: `${Math.min(index, 11) * 55}ms` }}
    >
      <div
        ref={frameRef}
        className={`tilt-frame product-media-frame relative w-full ${
          beauty ? "aspect-[4/5] bg-[#f4efe9]" : "aspect-[3/4] bg-neutral-100"
        }`}
        onPointerMove={tiltTo}
        onPointerLeave={resetTilt}
      >
        <Link href={`/products/${slug}`} className="absolute inset-0" aria-label={name}>
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.045]">
            <ProductMedia src={imageSrc} alt={name} fit="cover" focus={beauty ? "center" : "top"} />
            {showSecondary && secondarySrc ? (
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <ProductMedia src={secondarySrc} alt="" fit="cover" focus={beauty ? "center" : "top"} />
              </div>
            ) : null}
          </div>
        </Link>

        <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {isNew ? (
            <span className="bg-white/95 text-neutral-900 text-[10px] font-semibold tracking-[0.18em] uppercase px-2 py-1">
              New
            </span>
          ) : null}
          {onSale ? (
            <span className="bg-neutral-900 text-white text-[10px] font-semibold tracking-[0.18em] uppercase px-2 py-1">
              {salePct >= 1 ? `-${salePct}%` : "Sale"}
            </span>
          ) : null}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden p-3 sm:block group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
          <button
            type="button"
            disabled={quickState === "loading"}
            className={`${quickButtonClass} translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100`}
            onClick={handleQuickAdd}
          >
            {quickLabel}
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={quickState === "loading"}
        className={`${quickButtonClass} mt-2 sm:hidden`}
        onClick={handleQuickAdd}
      >
        {quickLabel}
      </button>

      <Link href={`/products/${slug}`} className="mt-3 flex flex-col gap-1">
        <h3 className="text-sm font-medium text-neutral-900 leading-snug tracking-wide">{name}</h3>
        <p className="text-xs text-neutral-500">
          {beauty
            ? category && !/^general$/i.test(category)
              ? category
              : "Beauty"
            : [fit, gender].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="text-sm font-semibold text-neutral-900">
            {hasVariantRange ? (
              <>
                <span className="mr-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-500">
                  From
                </span>
                {formatMoney(priceRange.min)}
              </>
            ) : (
              formatMoney(price)
            )}
          </p>
          {onSale ? (
            <p className="text-xs font-normal text-neutral-400 line-through">
              {formatMoney(compareAtPrice!)}
            </p>
          ) : null}
        </div>
        {swatches.length > 0 ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            {swatches.map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-2.5 w-2.5 rounded-full border border-neutral-300"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {extraColors > 0 ? (
              <span className="text-[10px] text-neutral-400">+{extraColors}</span>
            ) : null}
          </div>
        ) : colors && colors.length > 1 ? (
          <p className="text-[11px] text-neutral-400">
            {colors.length} {beauty ? "shades" : "colors"}
          </p>
        ) : null}
      </Link>
    </article>
  );
}
