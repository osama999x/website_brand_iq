"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CartItemRow from "../../components/CartItemRow";
import CartSummary from "../../components/CartSummary";
import { useCartStore, selectCartCount } from "../../store/cartStore";

function EmptyCartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-16 w-16 text-neutral-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  );
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const cartCount = useCartStore(selectCartCount);

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-xs text-neutral-500">
            <li>
              <Link href="/" className="hover:text-neutral-900 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-900 font-medium">Cart</li>
          </ol>
        </nav>

        {/* Page title */}
        <div className="mb-8 flex items-baseline gap-3">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
            Your Cart
          </h1>
          {cartCount > 0 && (
            <span className="text-sm text-neutral-500">
              ({cartCount} {cartCount === 1 ? "item" : "items"})
            </span>
          )}
        </div>

        {items.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <EmptyCartIcon />
            <h2 className="mt-6 text-lg font-bold text-neutral-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-neutral-500 max-w-xs">
              Looks like you haven&apos;t added anything yet. Browse our collection and find
              something you love.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-block bg-neutral-900 text-white text-xs font-bold tracking-[0.2em] uppercase px-10 py-4 hover:bg-neutral-700 transition-colors"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          /* ── Cart layout ── */
          <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-start">
            {/* Left — items list */}
            <div className="flex-1 min-w-0">
              {/* Continue shopping link */}
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-400">
                  Items
                </span>
                <Link
                  href="/products"
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 underline transition-colors"
                >
                  ← Continue Shopping
                </Link>
              </div>

              <ul className="space-y-4">
                {items.map((item) => (
                  <CartItemRow
                    key={`${item.productId}-${item.size}`}
                    item={item}
                  />
                ))}
              </ul>
            </div>

            {/* Right — order summary */}
            <CartSummary />
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
