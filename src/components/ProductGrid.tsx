import Link from "next/link";
import defaultProducts from "../data/products";
import ProductCard from "./ProductCard";
import type { Product } from "../data/products";
import type { ShopGender } from "../lib/shopGender";

interface ProductGridProps {
  products?: Product[];
  emptyMessage?: string;
  shop?: ShopGender;
}

const SHOP_COPY: Record<string, { kicker: string; title: string; href: string; cta: string }> = {
  men: { kicker: "Clothing", title: "Men", href: "/products?gender=men", cta: "Shop men" },
  women: { kicker: "Clothing", title: "Women", href: "/products?gender=women", cta: "Shop women" },
  juniors: { kicker: "Clothing", title: "Juniors", href: "/products?gender=juniors", cta: "Shop juniors" },
  cosmetics: { kicker: "Beauty", title: "Cosmetics", href: "/products?gender=cosmetics", cta: "Shop beauty" },
};

export default function ProductGrid({ products: productsProp, emptyMessage, shop }: ProductGridProps) {
  const products = productsProp ?? defaultProducts;
  const showEmpty = productsProp != null && products.length === 0;
  const copy = (shop && SHOP_COPY[shop]) || {
    kicker: "Curated for you",
    title: "Featured",
    href: "/products",
    cta: "Shop all",
  };
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      {/* Section header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-neutral-500 mb-2">
            {copy.kicker}
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight text-neutral-900">
            {copy.title}
          </h2>
        </div>
        <Link
          href={copy.href}
          className="group hidden sm:inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-neutral-900 border-b border-neutral-900 pb-0.5 hover:text-neutral-500 hover:border-neutral-500 transition-colors"
        >
          {copy.cta}
          <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
            →
          </span>
        </Link>
      </div>

      {/* Grid */}
      {showEmpty ? (
        <p className="text-sm text-neutral-500 py-12 text-center">
          {emptyMessage ?? "No products available right now."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}

      {/* Mobile shop all link */}
      <div className="mt-10 flex justify-center sm:hidden">
        <Link
          href={copy.href}
          className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-900 border-b-2 border-neutral-900 pb-0.5"
        >
          {copy.cta}
        </Link>
      </div>
    </section>
  );
}
