import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calcCartTotals } from "../lib/pricing";

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  price: number;
  taxAmount?: number;
  isTaxable?: boolean;
  image: string;
  size: string;
  /** Catalog variant SKU — required by backend for API products */
  sku?: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  /** True once the persisted state has been rehydrated from localStorage */
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (productId: number, size: string) => void;
  updateQuantity: (productId: number, size: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      addToCart: (newItem) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId && i.size === newItem.size
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId && i.size === newItem.size
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...newItem, quantity: 1 }] };
        }),

      removeFromCart: (productId, size) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.size === size)
          ),
        })),

      updateQuantity: (productId, size, quantity) =>
        set((state) => {
          if (quantity < 1) {
            return {
              items: state.items.filter(
                (i) => !(i.productId === productId && i.size === size)
              ),
            };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId && i.size === size
                ? { ...i, quantity }
                : i
            ),
          };
        }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "brandiq-cart",
      version: 2,
      migrate: (persistedState) => {
        // Keep backward compatibility if earlier carts used `unitPrice`.
        if (!persistedState || typeof persistedState !== "object") return persistedState as unknown as CartStore;
        const ps = persistedState as { items?: unknown; _hasHydrated?: unknown };
        const itemsRaw = Array.isArray(ps.items) ? ps.items : [];
        const items = itemsRaw.map((it) => {
          if (!it || typeof it !== "object") return it;
          const r = it as Record<string, unknown>;
          if (typeof r.unitPrice === "number" && typeof r.price !== "number") {
            return { ...r, price: r.unitPrice } as unknown;
          }
          // Ensure new optional fields exist (kept undefined if absent).
          return {
            ...r,
            ...(typeof r.taxAmount === "number" ? { taxAmount: r.taxAmount } : {}),
            ...(typeof r.isTaxable === "boolean" ? { isTaxable: r.isTaxable } : {}),
          } as unknown;
        });
        return { ...(persistedState as object), items } as unknown as CartStore;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/* ── Selectors ──────────────────────────────────────────────────── */

export const selectCartCount = (state: CartStore): number =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectSubtotal = (state: CartStore): number =>
  calcCartTotals(state.items).subtotal;
