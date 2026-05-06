import Link from "next/link";
import defaultProducts from "../data/products";
import ProductCard from "./ProductCard";
import type { Product } from "../data/products";

interface ProductGridProps {
  products?: Product[];
}

export default function ProductGrid({ products: productsProp }: ProductGridProps) {
  const products = productsProp ?? defaultProducts;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      {/* Section header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-neutral-500 mb-2">
            Curated for you
          </p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900">
            Featured Products
          </h2>
        </div>
        <Link
          href="/products"
          className="hidden sm:inline-block text-xs font-bold tracking-[0.2em] uppercase text-neutral-900 border-b-2 border-neutral-900 pb-0.5 hover:text-neutral-500 hover:border-neutral-500 transition-colors"
        >
          Shop All
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Mobile shop all link */}
      <div className="mt-10 flex justify-center sm:hidden">
        <Link
          href="/products"
          className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-900 border-b-2 border-neutral-900 pb-0.5"
        >
          Shop All
        </Link>
      </div>
    </section>
  );
}
