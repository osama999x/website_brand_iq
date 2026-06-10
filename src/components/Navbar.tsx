"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore, selectCartCount } from "../store/cartStore";

const categories = ["MEN", "WOMEN", "JUNIORS"] as const;

const genderHref: Record<(typeof categories)[number], string> = {
  MEN: "/?gender=men",
  WOMEN: "/?gender=women",
  JUNIORS: "/?gender=juniors",
};

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"
      />
    </svg>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const cartCount = useCartStore(selectCartCount);
  const hasHydrated = useCartStore((s) => s._hasHydrated);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  function onSubmitSearch(e: FormEvent) {
    e.preventDefault();
    const q = search.trim();
    setSearchOpen(false);
    if (!q) {
      router.push("/products");
      return;
    }
    router.push(`/products?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/loho-pnggg.png"
              alt="Brand IQ"
              width={120}
              height={36}
              priority
              className="object-contain"
            />
          </Link>

          {/* Desktop category links */}
          <ul className="hidden lg:flex items-center gap-8">
            {categories.map((cat) => (
              <li key={cat}>
                <Link
                  href={genderHref[cat]}
                  className="text-sm font-semibold tracking-widest transition-colors hover:text-neutral-500 text-neutral-900"
                >
                  {cat}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right icons */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                aria-label="Search"
                className="text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
                onClick={() => setSearchOpen((v) => !v)}
              >
                <SearchIcon />
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-10 w-[min(320px,calc(100vw-2rem))] border border-neutral-200 bg-white shadow-lg p-3">
                  <form onSubmit={onSubmitSearch} className="flex items-center gap-2">
                    <input
                      ref={searchInputRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search products…"
                      className="flex-1 border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900"
                    />
                    <button
                      type="submit"
                      className="border border-neutral-900 bg-neutral-900 text-white px-3 py-2 text-xs font-bold tracking-widest uppercase hover:bg-neutral-700 hover:border-neutral-700 transition-colors"
                    >
                      Go
                    </button>
                  </form>
                  <button
                    type="button"
                    className="mt-2 text-xs text-neutral-500 underline hover:text-neutral-900 transition-colors"
                    onClick={() => {
                      setSearch("");
                      setSearchOpen(false);
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            <Link
              href="/cart"
              aria-label={`Cart (${cartCount} items)`}
              className="relative text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              <CartIcon />
              {hasHydrated && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-white text-[10px] font-bold leading-none">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              aria-label="Toggle menu"
              className="lg:hidden text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer ml-1"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <HamburgerIcon open={menuOpen} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-neutral-100 py-3">
            <ul className="flex flex-col">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link
                    href={genderHref[cat]}
                    className="block px-2 py-3 text-sm font-semibold tracking-widest border-b border-neutral-100 last:border-0 transition-colors hover:bg-neutral-50 text-neutral-900"
                    onClick={() => setMenuOpen(false)}
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
