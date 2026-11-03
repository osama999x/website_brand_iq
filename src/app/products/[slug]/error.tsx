"use client";

import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function ProductError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-neutral-500">Product</p>
        <h1 className="font-display mt-3 text-4xl sm:text-5xl font-medium tracking-tight text-neutral-900">
          This piece didn’t load
        </h1>
        <p className="mt-4 text-sm text-neutral-500">
          The product page hit an error. You can try again, or go back to the shop.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-neutral-900 text-white text-xs font-semibold tracking-[0.18em] uppercase px-6 py-3 hover:bg-neutral-700"
          >
            Try again
          </button>
          <Link
            href="/products"
            className="border border-neutral-900 text-neutral-900 text-xs font-semibold tracking-[0.18em] uppercase px-6 py-3 hover:bg-neutral-900 hover:text-white"
          >
            Shop all
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
