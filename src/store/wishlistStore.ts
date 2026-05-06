"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  /** Set of liked product slugs/ids (we use product.slug which is Mongo _id for API products). */
  liked: Record<string, true>;
  toggle: (slug: string) => void;
  isLiked: (slug: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      liked: {},
      toggle: (slug) =>
        set((state) => {
          const key = slug.trim();
          if (!key) return state;
          const next = { ...state.liked };
          if (next[key]) delete next[key];
          else next[key] = true;
          return { liked: next };
        }),
      isLiked: (slug) => Boolean(get().liked[slug.trim()]),
      clear: () => set({ liked: {} }),
    }),
    { name: "brandiq-wishlist", version: 1 }
  )
);

