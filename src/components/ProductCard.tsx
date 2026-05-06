"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "../data/products";
import { formatMoney, getPriceRange } from "../lib/pricing";
import { useCartStore } from "../store/cartStore";

interface ProductCardProps {
  product: Product;
}

const FALLBACK_IMAGE =
  "https://placehold.co/600x800/e2e8f0/64748b?text=Product";

export default function ProductCard({ product }: ProductCardProps) {
  const { name, fit, gender, price, image, isNew, slug, sizes } = product;
  const priceRange = getPriceRange(product);
  const hasVariantRange = priceRange.min !== priceRange.max;
  const addToCart = useCartStore((s) => s.addToCart);
  const router = useRouter();
  const imageSrc =
    image?.startsWith("http://") || image?.startsWith("https://")
      ? image
      : FALLBACK_IMAGE;

  function handleQuickAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    // If product has real sizes, quick-add the first one.
    const firstSize = sizes?.[0];
    if (firstSize) {
      const key = String(firstSize).toUpperCase();
      const variantPrice = product.sizeToPrice?.[key];
      const variantSku = product.sizeToSku?.[key];
      addToCart({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: typeof variantPrice === "number" && Number.isFinite(variantPrice) ? variantPrice : product.price,
        ...(typeof product.taxAmount === "number" && Number.isFinite(product.taxAmount) && product.taxAmount > 0
          ? { taxAmount: product.taxAmount, ...(typeof product.isTaxable === "boolean" ? { isTaxable: product.isTaxable } : {}) }
          : {}),
        image: product.image,
        size: firstSize,
        ...(variantSku ? { sku: variantSku } : {}),
      });
      return;
    }

    // If there are no selectable options (or the listing lacks enough catalog data),
    // route to PDP so the user can choose the correct variant.
    router.push(`/products/${slug}`);
  }

  return (
    <article className="group flex flex-col">
      {/* Linked image + info */}
      <Link href={`/products/${slug}`} className="flex flex-col flex-1">
        {/* Image wrapper */}
        <div className="relative overflow-hidden bg-neutral-100 aspect-[3/4]">
          <Image
            src={imageSrc}
            alt={name}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
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
          className="w-full translate-y-0 opacity-100 sm:translate-y-full sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 transition-all duration-300 bg-neutral-900 text-white text-xs font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-neutral-700 cursor-pointer"
          onClick={handleQuickAdd}
        >
          Quick Add
        </button>
      </div>
    </article>
  );
}
