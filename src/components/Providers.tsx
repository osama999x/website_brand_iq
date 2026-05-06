"use client";

import { CategoriesProvider } from "../context/CategoriesContext";
import type { ApiCategory } from "../types/api";

/**
 * Top-level client boundary. Add any future providers here.
 * Cart state is managed by Zustand (no provider needed).
 */
export default function Providers({
  children,
  initialCategories = [],
}: {
  children: React.ReactNode;
  initialCategories?: ApiCategory[];
}) {
  return (
    <CategoriesProvider initialCategories={initialCategories}>
      {children}
    </CategoriesProvider>
  );
}
