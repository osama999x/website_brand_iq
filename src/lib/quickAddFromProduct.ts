import type { Product } from "../data/products";
import type { CartItem } from "../store/cartStore";
import { isMongoObjectId, lookupPriceForSize, lookupSkuForSize } from "./productVariantMaps";

function findColorBucketKey(
  colorSizeMaps: NonNullable<Product["colorSizeMaps"]>,
  colorName: string
): string | undefined {
  if (Object.prototype.hasOwnProperty.call(colorSizeMaps, colorName)) return colorName;
  const want = colorName.trim().toLowerCase();
  for (const k of Object.keys(colorSizeMaps)) {
    if (k.trim().toLowerCase() === want) return k;
  }
  return Object.keys(colorSizeMaps)[0];
}

/**
 * Builds a cart line using the first catalog variant (first color × first size when applicable),
 * matching ProductInfo add-to-cart shape so checkout SKU resolution succeeds.
 */
export function buildQuickAddCartLine(product: Product): Omit<CartItem, "quantity"> | null {
  const {
    id,
    slug,
    name,
    price,
    image,
    taxAmount,
    isTaxable,
    colors,
    colorSizeMaps,
    sizes,
    sizeToSku,
    sizeToPrice,
    baseSku,
  } = product;

  const taxPart =
    typeof taxAmount === "number" && Number.isFinite(taxAmount) && taxAmount > 0
      ? { taxAmount, ...(typeof isTaxable === "boolean" ? { isTaxable } : {}) }
      : {};

  const hasColors = (colors?.length ?? 0) > 0;
  const hasSizes = sizes.length > 0;
  const hasBuckets =
    colorSizeMaps != null && Object.keys(colorSizeMaps).length > 0;

  // 1) Color + size (API matrix)
  if (hasColors && hasSizes && hasBuckets) {
    const firstColorName = colors![0]!.name;
    const colorKey = findColorBucketKey(colorSizeMaps!, firstColorName);
    if (!colorKey) return null;
    const bucket = colorSizeMaps![colorKey];
    const firstSize = bucket.sizes[0];
    if (!firstSize) return null;
    const sku =
      lookupSkuForSize(bucket.sizeToSku, firstSize) ??
      (typeof colors![0]!.sku === "string" && colors![0]!.sku.trim() ? colors![0]!.sku.trim() : undefined) ??
      (baseSku?.trim() ? baseSku.trim() : undefined);
    if (!sku && isMongoObjectId(slug)) return null;
    const unit =
      lookupPriceForSize(bucket.sizeToPrice, firstSize) ??
      (typeof colors![0]!.price === "number" && colors![0]!.price! > 0 ? colors![0]!.price : undefined) ??
      price;
    return {
      productId: id,
      slug,
      name,
      price: unit,
      ...taxPart,
      image,
      size: `${firstSize} (${colorKey})`,
      ...(sku ? { sku } : {}),
    };
  }

  // Inconsistent shape: colors + sizes but no per-color maps — force PDP
  if (hasColors && hasSizes && !hasBuckets) return null;

  // 2) Size only (no colors)
  if (hasSizes && !hasColors) {
    const firstSize = sizes[0]!;
    const key = firstSize.toUpperCase();
    const sku =
      sizeToSku?.[key] ??
      (sizeToSku ? lookupSkuForSize(sizeToSku, firstSize) : undefined) ??
      (baseSku?.trim() ? baseSku.trim() : undefined);
    if (!sku && isMongoObjectId(slug)) return null;
    const unit =
      sizeToPrice?.[key] ??
      (sizeToPrice ? lookupPriceForSize(sizeToPrice, firstSize) : undefined) ??
      price;
    return {
      productId: id,
      slug,
      name,
      price: unit,
      ...taxPart,
      image,
      size: firstSize,
      ...(sku ? { sku } : {}),
    };
  }

  // 3) Color only (no sizes)
  if (hasColors && !hasSizes) {
    const c = colors![0]!;
    const sku = (typeof c.sku === "string" && c.sku.trim() ? c.sku.trim() : undefined) ?? baseSku?.trim();
    if (!sku && isMongoObjectId(slug)) return null;
    const unit = typeof c.price === "number" && c.price > 0 ? c.price : price;
    return {
      productId: id,
      slug,
      name,
      price: unit,
      ...taxPart,
      image,
      size: `ONE SIZE (${c.name})`,
      ...(sku ? { sku } : {}),
    };
  }

  // 4) Single SKU / one-size product
  if (baseSku?.trim()) {
    return {
      productId: id,
      slug,
      name,
      price,
      ...taxPart,
      image,
      size: "ONE SIZE",
      sku: baseSku.trim(),
    };
  }

  return null;
}
