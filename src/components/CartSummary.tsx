"use client";

import { useRouter } from "next/navigation";
import { useCartStore, selectCartCount, selectSubtotal } from "../store/cartStore";
import { calcCartTotals, formatMoney, PRICING } from "../lib/pricing";

export default function CartSummary() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectSubtotal);
  const cartCount = useCartStore(selectCartCount);
  const router = useRouter();

  const { shipping, tax, total } = calcCartTotals(items);
  const remainingForFreeShipping = PRICING.freeShippingThreshold - subtotal;

  return (
    <aside className="lg:w-80 xl:w-96 flex-shrink-0">
      <div className="border border-neutral-200 p-6">
        <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-neutral-900 mb-5">
          Order Summary
        </h2>

        {/* Free shipping progress */}
        {subtotal > 0 && subtotal < PRICING.freeShippingThreshold && (
          <div className="mb-5 p-3 bg-neutral-50 border border-neutral-100">
            <p className="text-xs text-neutral-600 mb-2">
              Add{" "}
              <span className="font-semibold text-neutral-900">
                {formatMoney(remainingForFreeShipping)}
              </span>{" "}
              more for free shipping
            </p>
            <div className="w-full bg-neutral-200 h-1">
              <div
                className="bg-neutral-900 h-1 transition-all duration-500"
                style={{ width: `${(subtotal / PRICING.freeShippingThreshold) * 100}%` }}
              />
            </div>
          </div>
        )}

        {subtotal >= PRICING.freeShippingThreshold && subtotal > 0 && (
          <div className="mb-5 p-3 bg-green-50 border border-green-100">
            <p className="text-xs text-green-700 font-semibold">
              🎉 You qualify for free shipping!
            </p>
          </div>
        )}

        {/* Line items */}
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-600">
              Subtotal{" "}
              <span className="text-neutral-400">
                ({cartCount} {cartCount === 1 ? "item" : "items"})
              </span>
            </dt>
            <dd className="font-semibold text-neutral-900">
              {formatMoney(subtotal)}
            </dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-neutral-600">Tax</dt>
            <dd className="font-semibold text-neutral-900">
              {tax > 0 ? formatMoney(tax) : "—"}
            </dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-neutral-600">Shipping</dt>
            <dd className={`font-semibold ${shipping === 0 ? "text-green-600" : "text-neutral-900"}`}>
              {shipping === 0 ? (subtotal === 0 ? "—" : "Free") : formatMoney(shipping)}
            </dd>
          </div>
        </dl>

        <div className="my-4 border-t border-neutral-200" />

        {/* Total */}
        <div className="flex justify-between items-baseline mb-6">
          <span className="text-sm font-bold tracking-wide uppercase text-neutral-900">Total</span>
          <span className="text-xl font-black text-neutral-900">
            {formatMoney(total)}
          </span>
        </div>

        {/* Checkout button */}
        <button
          disabled={cartCount === 0}
          onClick={() => router.push("/checkout")}
          className={`w-full py-4 text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-200 ${
            cartCount === 0
              ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              : "bg-neutral-900 text-white hover:bg-neutral-700 cursor-pointer"
          }`}
        >
          Proceed to Checkout
        </button>

        <p className="mt-3 text-center text-xs text-neutral-400">
          Taxes are included in total when provided by product API
        </p>
      </div>

      {/* Accepted payments note */}
      <p className="mt-4 text-center text-xs text-neutral-400">
        We accept Cash on Delivery · Bank Transfer · Easy Paisa
      </p>
    </aside>
  );
}
