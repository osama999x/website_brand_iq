"use client";

import Link from "next/link";
import ProductMedia from "./ProductMedia";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "../data/products";
import { resolveProductImageUrl } from "../lib/assets";
import { formatMoney, getPriceRange } from "../lib/pricing";
import { buildQuickAddCartLine } from "../lib/quickAddFromProduct";
import { isMongoObjectId } from "../lib/productVariantMaps";
import { getProductDetail } from "../services/homeService";
import { mapApiProductDetailToProduct } from "../types/api";
import { useCartStore } from "../store/cartStore";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { name, fit, gender, price, image, images, isNew, slug } = product;
  const priceRange = getPriceRange(product);
  const hasVariantRange = priceRange.min !== priceRange.max;
  const addToCart = useCartStore((s) => s.addToCart);
  const router = useRouter();
  const [quickLoading, setQuickLoading] = useState(false);
  const imageSrc = resolveProductImageUrl(image || images?.[0]);

  async function handleQuickAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (quickLoading) return;
    setQuickLoading(true);
    try {
      let resolved: Product = product;
      if (isMongoObjectId(product.slug)) {
        try {
          const detail = await getProductDetail(product.slug);
          resolved = mapApiProductDetailToProduct(detail);
        } catch {
          router.push(`/products/${product.slug}`);
          return;
        }
      }

      const line = buildQuickAddCartLine(resolved);
      if (!line) {
        router.push(`/products/${product.slug}`);
        return;
      }
      addToCart(line);
    } finally {
      setQuickLoading(false);
    }
  }

  return (
    <article className="group flex flex-col">
      {/* Linked image + info */}
      <Link href={`/products/${slug}`} className="flex flex-col flex-1">
        {/* Image wrapper */}
        <div className="relative overflow-hidden bg-neutral-100 aspect-[3/4]">
          <ProductMedia
            src={imageSrc}
            alt={name}
            className="product-media-image transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* NEW badge */}
          {isNew && (
            <span className="absolute top-3 left-3 bg-neutral-900 text-white text-[10px] font-bold tracking-widest uppercase px-2 py-1">
              New
            </span>
          )}
        </div>

        {/* Product info */}
        <div className="mt-3 flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-neutral-900 leading-snug">{name}</h3>
          <p className="text-xs text-neutral-500">
            {fit} | {gender}
          </p>
          <p className="text-sm font-bold text-neutral-900 mt-0.5">
            {hasVariantRange ? (
              <>
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-neutral-500 mr-1.5">
                  From
                </span>
                {formatMoney(priceRange.min)}
              </>
            ) : (
              formatMoney(price)
            )}
          </p>
        </div>
      </Link>

      {/* Quick Add — outside Link so it doesn't navigate */}
      <div className="overflow-hidden mt-2">
        <button
          type="button"
          disabled={quickLoading}
          className="w-full translate-y-0 opacity-100 sm:translate-y-full sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 transition-all duration-300 bg-neutral-900 text-white text-xs font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-neutral-700 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          onClick={handleQuickAdd}
        >
          {quickLoading ? "Adding…" : "Quick Add"}
        </button>
      </div>
    </article>
  );
}
