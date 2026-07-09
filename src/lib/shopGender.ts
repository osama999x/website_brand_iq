const COSMETICS_NAME_RE = /cosmetic|herbal/i;

export type ShopGender = "men" | "women" | "juniors" | "unisex" | "cosmetics";

export const SHOP_GENDERS: ShopGender[] = ["men", "women", "juniors", "unisex", "cosmetics"];

export function parseShopGender(value?: string | null): ShopGender | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase().trim();
  return SHOP_GENDERS.includes(normalized as ShopGender) ? (normalized as ShopGender) : undefined;
}

export function isCosmeticsCategory(category?: { gender?: string; name?: string } | null) {
  if (!category) return false;
  if (category.gender === "cosmetics") return true;
  return COSMETICS_NAME_RE.test(category.name ?? "");
}

export function isCosmeticsProduct(product: {
  category?: { gender?: string; name?: string } | string | null;
  categoryGender?: ShopGender;
}) {
  if (product.categoryGender === "cosmetics") return true;
  const category =
    typeof product.category === "string"
      ? { name: product.category, gender: product.categoryGender }
      : product.category;
  return isCosmeticsCategory(category);
}

export function shouldShowSizeUi(product: {
  category?: { gender?: string; name?: string } | string | null;
  categoryGender?: ShopGender;
}) {
  return !isCosmeticsProduct(product);
}

export function resolveOrderSize(
  product: { category?: { gender?: string; name?: string } | string | null; categoryGender?: ShopGender },
  selectedSize?: string
) {
  if (!shouldShowSizeUi(product)) return "";
  return selectedSize ?? "";
}

export type ProductGenderLabel = "Men" | "Women" | "Juniors" | "Unisex" | "Cosmetics";

export function toProductGenderLabel(gender?: string | null): ProductGenderLabel | undefined {
  const parsed = parseShopGender(gender);
  if (!parsed) return undefined;
  switch (parsed) {
    case "women":
      return "Women";
    case "juniors":
      return "Juniors";
    case "cosmetics":
      return "Cosmetics";
    case "unisex":
      return "Unisex";
    case "men":
    default:
      return "Men";
  }
}
