"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "../data/products";
import { useCartStore } from "../store/cartStore";
import { useWishlistStore } from "../store/wishlistStore";
import { lookupSkuForSize, lookupPriceForSize } from "../lib/productVariantMaps";
import { formatMoney, getPriceRange, getUnitPrice } from "../lib/pricing";
import { isCosmeticsProduct, resolveOrderSize, shouldShowSizeUi } from "../lib/shopGender";
import Link from "next/link";
import RichTextContent from "./RichTextContent";

interface ProductInfoProps {
  product: Product;
}

function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-neutral-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left cursor-pointer"
      >
        <span className="text-sm font-semibold text-neutral-900 tracking-wide">{title}</span>
        <span
          className={`text-neutral-500 text-lg leading-none select-none transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden" inert={open ? undefined : true}>
          <div className="pb-4 text-sm text-neutral-600 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** When color+size is required but one dimension is unset, match listing cards: first API color × its first size row. */
function getDefaultColorSizeUnitPrice(product: Product, selectedColor: string): number {
  const { colors, colorSizeMaps, price } = product;
  const resolvedColor =
    selectedColor && colors?.some((c) => c.name === selectedColor)
      ? selectedColor
      : colors?.[0]?.name ?? "";
  if (!resolvedColor || !colorSizeMaps?.[resolvedColor]) return price;
  const m = colorSizeMaps[resolvedColor];
  const firstKey = m.sizes[0];
  if (!firstKey) return price;
  const unit =
    m.sizeToPrice[firstKey] ??
    (m.sizeToPrice ? lookupPriceForSize(m.sizeToPrice, firstKey) : undefined);
  return typeof unit === "number" && unit > 0 ? unit : price;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const {
    name,
    fit,
    gender,
    price,
    compareAtPrice,
    taxAmount,
    isTaxable,
    category,
    isNew,
    description,
    longDescription,
    sizeGuide,
    sizeFit,
    deliveryReturns,
    colors,
    baseSku,
    sizes,
    sizeToSku,
    sizeToPrice,
    sizeToCompareAtPrice,
    colorSizeMaps,
    categoryGender,
  } = product;
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [feedback, setFeedback] = useState<"idle" | "added" | "no-size">("idle");
  const isLiked = useWishlistStore((s) => s.isLiked(product.slug));
  const toggleLike = useWishlistStore((s) => s.toggle);

  const addToCart = useCartStore((s) => s.addToCart);
  const router = useRouter();
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showDock, setShowDock] = useState(false);

  const showSizeUi = shouldShowSizeUi({ category: { gender: categoryGender, name: category }, categoryGender });
  const beauty =
    gender === "Cosmetics" ||
    isCosmeticsProduct({ category, categoryGender });

  useEffect(() => {
    const el = addButtonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowDock(!entry.isIntersecting),
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const needsSize = showSizeUi && sizes.length > 0;
  const hasColors = (colors?.length ?? 0) > 0;
  const isColorAndSize = hasColors && needsSize;

  const selectedColorObj =
    (hasColors ? colors?.find((c) => c.name === selectedColor) : undefined) ??
    (hasColors ? colors?.[0] : undefined);

  const scopedSizes = isColorAndSize
    ? (selectedColor && colorSizeMaps?.[selectedColor]?.sizes?.length
        ? colorSizeMaps[selectedColor]!.sizes
        : [])
    : sizes;

  const selectedUnitPrice = isColorAndSize
    ? (() => {
        if (!selectedColor || !selectedSize) {
          return getDefaultColorSizeUnitPrice(product, selectedColor);
        }
        const key = selectedSize.toUpperCase();
        const m = colorSizeMaps?.[selectedColor];
        const p =
          m?.sizeToPrice?.[key] ??
          (m?.sizeToPrice ? lookupPriceForSize(m.sizeToPrice, selectedSize) : undefined);
        return p ?? product.price;
      })()
    : needsSize
      ? getUnitPrice(product, selectedSize || undefined)
      : selectedColorObj?.price ?? product.price;

  const effectiveCompareAt = isColorAndSize
    ? (() => {
        if (!selectedColor || !selectedSize) return undefined;
        const key = selectedSize.toUpperCase();
        const m = colorSizeMaps?.[selectedColor];
        return (
          m?.sizeToCompareAtPrice?.[key] ??
          (m?.sizeToCompareAtPrice ? m.sizeToCompareAtPrice[key.replace(/\s+/g, "")] : undefined) ??
          undefined
        );
      })()
    : needsSize
      ? (() => {
          if (!selectedSize) return undefined;
          const key = selectedSize.toUpperCase();
          return (
            sizeToCompareAtPrice?.[key] ??
            (sizeToCompareAtPrice ? sizeToCompareAtPrice[key.replace(/\s+/g, "")] : undefined) ??
            undefined
          );
        })()
      : (!needsSize && selectedColorObj?.compareAtPrice != null ? selectedColorObj.compareAtPrice : compareAtPrice) ??
        undefined;
  const showCompare =
    typeof effectiveCompareAt === "number" &&
    Number.isFinite(effectiveCompareAt) &&
    effectiveCompareAt > 0 &&
    effectiveCompareAt > selectedUnitPrice;

  const normalizedSizeGuide = (sizeGuide ?? "").trim();
  const normalizedSizeFit = (sizeFit ?? "").trim();
  const fitLabel = `${fit} ${gender}`.trim().toLowerCase();
  const shouldShowSizeGuide =
    normalizedSizeGuide.length > 0 &&
    normalizedSizeGuide.toLowerCase() !== normalizedSizeFit.toLowerCase() &&
    normalizedSizeGuide.toLowerCase() !== fitLabel;

  const priceRange = getPriceRange(product);
  const hasVariantRange = priceRange.min !== priceRange.max;
  const salePct =
    showCompare && effectiveCompareAt
      ? Math.round((1 - selectedUnitPrice / effectiveCompareAt) * 100)
      : 0;
  const categoryLabel = /^(man|men|woman|women|junior|juniors|unisex|cosmetic|cosmetics|beauty|general)$/i.test(
    (category ?? "").trim()
  )
    ? null
    : category;

  /** Size-only products: true "FROM" across sizes. Color+size uses first color × first size, not global min. */
  const showingFromPrice =
    !isColorAndSize && !selectedSize && needsSize && hasVariantRange;

  function handleAddToCart() {
    const needsColor = hasColors;

    if (showSizeUi && needsSize && !selectedSize) {
      setFeedback("no-size");
      setTimeout(() => setFeedback("idle"), 2000);
      return;
    }
    if (needsColor && !selectedColor) {
      setFeedback("no-size");
      setTimeout(() => setFeedback("idle"), 2000);
      return;
    }

    const rawSize = isColorAndSize
      ? `${selectedSize} (${selectedColor})`
      : needsSize
        ? selectedSize
        : colors?.length
          ? `ONE SIZE (${selectedColor || colors[0]?.name || "DEFAULT"})`
          : "ONE SIZE";

    const cartSize = resolveOrderSize(
      { category: { gender: categoryGender, name: category }, categoryGender },
      rawSize
    );

    const sizeKey = selectedSize.toUpperCase();
    const unitPrice =
      (isColorAndSize
        ? (() => {
            const m = selectedColor ? colorSizeMaps?.[selectedColor] : undefined;
            return (
              (m?.sizeToPrice?.[sizeKey] ??
                (m?.sizeToPrice ? lookupPriceForSize(m.sizeToPrice, selectedSize) : undefined)) ??
              price
            );
          })()
        : needsSize
          ? (sizeToPrice?.[sizeKey] ??
              (sizeToPrice ? lookupPriceForSize(sizeToPrice, selectedSize) : undefined))
          : selectedColorObj?.price) ?? price;
    const catalogSku =
      (isColorAndSize
        ? (() => {
            const m = selectedColor ? colorSizeMaps?.[selectedColor] : undefined;
            return (
              (m?.sizeToSku?.[sizeKey] ??
                (m?.sizeToSku ? lookupSkuForSize(m.sizeToSku, selectedSize) : undefined)) ??
              selectedColorObj?.sku
            );
          })()
        : needsSize
          ? (sizeToSku?.[sizeKey] ??
              (sizeToSku ? lookupSkuForSize(sizeToSku, selectedSize) : undefined))
          : selectedColorObj?.sku) ??
      baseSku ??
      undefined;

    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: unitPrice,
      ...(typeof taxAmount === "number" && Number.isFinite(taxAmount) && taxAmount > 0
        ? { taxAmount, ...(typeof isTaxable === "boolean" ? { isTaxable } : {}) }
        : {}),
      image: product.image,
      size: cartSize,
      ...(catalogSku ? { sku: catalogSku } : {}),
    });
    setFeedback("added");
    setTimeout(() => setFeedback("idle"), 2000);
  }

  return (
    <div className="flex flex-col">
      {/* Category + New badge */}
      <div className="flex items-center gap-2 mb-3">
        {categoryLabel ? (
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-neutral-500">
            {categoryLabel}
          </span>
        ) : null}
        {isNew && (
          <span className="bg-neutral-900 text-white text-[10px] font-bold tracking-widest uppercase px-2 py-0.5">
            New
          </span>
        )}
      </div>

      {/* Product name */}
      <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-medium tracking-tight text-neutral-900 leading-[1.08]">
        {name}
      </h1>

      {/* Fit & gender */}
      <p className="mt-1.5 text-sm text-neutral-500">
        {beauty ? "Beauty" : [fit, gender].filter(Boolean).join(" · ")}
      </p>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-3 flex-wrap">
        <p className="text-2xl font-bold text-neutral-900">
          {!isColorAndSize && !selectedSize && needsSize && hasVariantRange ? (
            <>
              <span className="text-sm font-semibold tracking-[0.2em] uppercase text-neutral-500 mr-2">
                From
              </span>
              {formatMoney(priceRange.min)}
            </>
          ) : (
            formatMoney(selectedUnitPrice)
          )}
        </p>
        {showCompare ? (
          <p className="text-sm font-semibold text-neutral-400 line-through">
            {formatMoney(effectiveCompareAt!)}
          </p>
        ) : null}
        {salePct >= 1 ? (
          <span className="bg-neutral-900 text-white text-[10px] font-semibold tracking-[0.16em] uppercase px-2 py-1">
            -{salePct}%
          </span>
        ) : null}
      </div>
      {typeof taxAmount === "number" && Number.isFinite(taxAmount) && taxAmount > 0 ? (
        <p className="mt-1 text-xs text-neutral-400">
          Tax: {formatMoney(taxAmount)} {isTaxable === false ? "(not applied)" : "per item"}
        </p>
      ) : null}

      <div className="my-5 border-t border-neutral-200" />

      {/* Color selector (for color-only variants) */}
      {colors?.length ? (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900">
              {beauty ? "Select Shade" : "Select Color"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setSelectedColor(c.name);
                  setFeedback("idle");
                }}
                className={`h-11 px-3 border text-sm font-medium transition-all duration-150 cursor-pointer ${
                  selectedColor === c.name
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {c.hex ? (
                    <span
                      className="h-3 w-3 border border-neutral-300 inline-block"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden="true"
                    />
                  ) : null}
                  {c.name}
                </span>
              </button>
            ))}
          </div>
          {!needsSize && feedback === "no-size" && !selectedColor && (
            <p className="mt-2 text-xs text-red-500 font-medium">Please select a color to continue</p>
          )}
          {isColorAndSize && feedback === "no-size" && !selectedColor && (
            <p className="mt-2 text-xs text-red-500 font-medium">Please select a color to see available sizes</p>
          )}
        </div>
      ) : null}

      {/* Size selector */}
      {showSizeUi && (isColorAndSize ? scopedSizes.length > 0 : sizes.length > 0) ? (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900">
              Select Size
            </span>
            <Link
              href="/size-guide"
              className="text-xs text-neutral-500 underline hover:text-neutral-900 transition-colors"
            >
              Size Guide
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {(isColorAndSize ? scopedSizes : sizes).map((size) => (
              <button
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  setFeedback("idle");
                }}
                className={`size-chip min-w-[48px] h-11 px-3 border text-sm font-medium cursor-pointer ${
                  selectedSize === size
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          {isColorAndSize && !selectedColor && (
            <p className="mt-2 text-xs text-neutral-400">Select a color first</p>
          )}
          {feedback === "no-size" && (
            <p className="mt-2 text-xs text-red-500 font-medium">Please select a size to continue</p>
          )}
        </div>
      ) : null}

      {/* Add to cart + Wishlist */}
      <div className="flex gap-3">
        <button
          ref={addButtonRef}
          onClick={handleAddToCart}
          className={`flex-1 py-4 text-sm font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer active:scale-[0.99] ${
            feedback === "added"
              ? "bg-green-700 text-white"
              : "bg-neutral-900 text-white hover:bg-neutral-700"
          }`}
        >
          {feedback === "added" ? "Added to Cart ✓" : "Add to Cart"}
        </button>

        <button
          onClick={() => toggleLike(product.slug)}
          aria-label="Add to wishlist"
          className={`w-14 border flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isLiked
              ? "border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100"
              : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 hover:text-neutral-900"
          }`}
        >
          <span className={isLiked ? "animate-heart" : ""}>
            <HeartIcon filled={isLiked} />
          </span>
        </button>
      </div>

      {/* View cart link — visible only after adding */}
      {showDock ? (
        <div className="buy-dock sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur px-4 py-3 flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">{formatMoney(selectedUnitPrice)}</p>
            <p className="truncate text-[11px] text-neutral-500">{name}</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className={`ml-auto shrink-0 px-5 py-3 text-[11px] font-semibold tracking-[0.16em] uppercase text-white ${
              feedback === "added" ? "bg-green-700" : "bg-neutral-900"
            }`}
          >
            {feedback === "added" ? "Added" : "Add to Cart"}
          </button>
        </div>
      ) : null}

      {feedback === "added" && (
        <button
          onClick={() => router.push("/cart")}
          className="mt-3 text-xs text-center font-semibold underline text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          View Cart →
        </button>
      )}

      <div className="mt-6 border-t border-neutral-200" />

      {/* Accordion details */}
      <div className="mt-1">
        <AccordionItem title="Product Description">
          {longDescription &&
          description &&
          longDescription.trim() !== description.trim() ? (
            <div className="space-y-3">
              <RichTextContent html={description} />
              <RichTextContent html={longDescription} />
            </div>
          ) : (
            <RichTextContent html={longDescription || description} />
          )}
        </AccordionItem>
        {showSizeUi ? (
          <AccordionItem title="Size & Fit">
            {sizeFit ? (
              <p>{sizeFit}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                <li>Fit: {fit}</li>
              </ul>
            )}
            {shouldShowSizeGuide ? (
              <div className="mt-3 pt-3 border-t border-neutral-200">
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900 mb-2">
                  Size Guide
                </p>
                <p className="whitespace-pre-wrap">{normalizedSizeGuide}</p>
              </div>
            ) : null}
          </AccordionItem>
        ) : null}
        <AccordionItem title="Delivery & Returns">
          {deliveryReturns ? (
            <p className="whitespace-pre-wrap">{deliveryReturns}</p>
          ) : (
            <ul className="list-disc list-inside space-y-1">
              <li>Free standard delivery on orders over PKR 5,000</li>
              <li>Express delivery available at checkout</li>
              <li>Free returns within 30 days of purchase</li>
              <li>Items must be unworn and in original packaging</li>
            </ul>
          )}
        </AccordionItem>
      </div>
    </div>
  );
}
