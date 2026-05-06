"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore, type CartItem } from "../store/cartStore";
import { formatMoney } from "../lib/pricing";

interface CartItemRowProps {
  item: CartItem;
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const { productId, slug, name, price, image, size, quantity } = item;

  return (
    <li className="flex gap-4 p-5 sm:p-6 border border-neutral-200 bg-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)]">
      {/* Product image */}
      <Link href={`/products/${slug}`} className="flex-shrink-0">
        <div className="relative w-24 h-32 sm:w-28 sm:h-36 bg-neutral-100 overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover object-center"
            sizes="120px"
          />
        </div>
      </Link>

      {/* Item details */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/products/${slug}`}
              className="text-sm font-semibold text-neutral-900 leading-snug hover:text-neutral-600 transition-colors line-clamp-2"
            >
              {name}
            </Link>
            <p className="mt-1 text-xs text-neutral-500">Size: {size}</p>
          </div>

          {/* Remove button */}
          <button
            onClick={() => removeFromCart(productId, size)}
            aria-label={`Remove ${name} from cart`}
            className="flex-shrink-0 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer p-1"
          >
            <TrashIcon />
          </button>
        </div>

        {/* Quantity + price row */}
        <div className="mt-3 flex items-center justify-between gap-4">
          {/* Quantity stepper */}
          <div className="flex items-center border border-neutral-300">
            <button
              onClick={() => updateQuantity(productId, size, quantity - 1)}
              aria-label="Decrease quantity"
              className="w-9 h-9 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer text-lg leading-none"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold text-neutral-900 select-none">
              {quantity}
            </span>
            <button
              onClick={() => updateQuantity(productId, size, quantity + 1)}
              aria-label="Increase quantity"
              className="w-9 h-9 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer text-lg leading-none"
            >
              +
            </button>
          </div>

          {/* Line price */}
          <p className="text-sm font-bold text-neutral-900">
            {formatMoney(price * quantity)}
          </p>
        </div>
      </div>
    </li>
  );
}
