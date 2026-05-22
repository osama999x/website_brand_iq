import type { CartItem } from "../store/cartStore";
import type { Product } from "../data/products";
import { lookupPriceForSize } from "./productVariantMaps";

export const PRICING = {
  currency: "PKR" as const,
  locale: "en-PK" as const,
  freeShippingThreshold: 5000,
  shippingCost: 500,
} as const;

const moneyFormatter = new Intl.NumberFormat(PRICING.locale, {
  style: "currency",
  currency: PRICING.currency,
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return moneyFormatter.format(safe);
}
//
export type PriceFields = {
  discountedPrice?: number | null;
  actualPrice?: number | null;
  isDiscount?: boolean;
  isSale?: boolean;
  discount?: number;
};

/** Use discounted price only when the API marks an active sale/discount. */
export function shouldUseDiscountedPrice(input: PriceFields): boolean {
  if (input.isSale === true) return true;
  if (typeof input.discount === "number" && Number.isFinite(input.discount) && input.discount > 0) {
    return true;
  }
  if (input.isDiscount === false) return false;
  if (input.isDiscount !== true) return false;

  const d = input.discountedPrice;
  const a = input.actualPrice;
  return (
    typeof d === "number" &&
    Number.isFinite(d) &&
    d > 0 &&
    typeof a === "number" &&
    Number.isFinite(a) &&
    a > d
  );
}

export function pickEffectivePrice(input: PriceFields): number {
  const a = input.actualPrice;
  if (shouldUseDiscountedPrice(input)) {
    const d = input.discountedPrice;
    if (typeof d === "number" && Number.isFinite(d) && d > 0) return d;
  }
  if (typeof a === "number" && Number.isFinite(a) && a > 0) return a;
  return 0;
}

export function pickCompareAtPrice(input: PriceFields): number | undefined {
  if (!shouldUseDiscountedPrice(input)) return undefined;
  const a = input.actualPrice;
  if (typeof a === "number" && Number.isFinite(a) && a > 0) return a;
  return undefined;
}

export function getUnitPrice(product: Product, selectedSize?: string): number {
  if (!selectedSize) return product.price;
  const sizeKey = selectedSize.toUpperCase();
  const direct = product.sizeToPrice?.[sizeKey];
  if (direct != null && direct > 0) return direct;
  const mapped = product.sizeToPrice
    ? lookupPriceForSize(product.sizeToPrice, selectedSize)
    : undefined;
  if (mapped != null && mapped > 0) return mapped;
  const range = getPriceRange(product);
  if (range.min > 0) return range.min;
  return product.price;
}

export function getPriceRange(product: Product): { min: number; max: number } {
  const sizePrices = Object.values(product.sizeToPrice ?? {}).filter(
    (n) => typeof n === "number" && Number.isFinite(n) && n > 0
  );
  if (sizePrices.length > 0) {
    let min = sizePrices[0]!;
    let max = sizePrices[0]!;
    for (const p of sizePrices) {
      if (p < min) min = p;
      if (p > max) max = p;
    }
    return { min, max };
  }

  const colorPrices = (product.colors ?? [])
    .map((c) => c.price)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0);
  if (colorPrices.length > 0) {
    let min = colorPrices[0]!;
    let max = colorPrices[0]!;
    for (const p of colorPrices) {
      if (p < min) min = p;
      if (p > max) max = p;
    }
    return { min, max };
  }

  return { min: product.price, max: product.price };
}

export function calcCartTotals(items: Array<Pick<CartItem, "price" | "quantity">>): {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
} {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = (items as Array<Pick<CartItem, "taxAmount" | "isTaxable" | "quantity">>).reduce(
    (sum, i) => {
      const unit = (i as { taxAmount?: unknown }).taxAmount;
      const taxable = (i as { isTaxable?: unknown }).isTaxable;
      const shouldApply =
        taxable === true || (taxable == null && typeof unit === "number" && Number.isFinite(unit) && unit > 0);
      if (!shouldApply) return sum;
      if (typeof unit !== "number" || !Number.isFinite(unit) || unit <= 0) return sum;
      return sum + unit * i.quantity;
    },
    0
  );
  const shipping =
    subtotal === 0 || subtotal >= PRICING.freeShippingThreshold ? 0 : PRICING.shippingCost;
  const total = subtotal + tax + shipping;
  return { subtotal, tax, shipping, total };
}

