"use client";

import { createContext, useContext, ReactNode } from "react";
import type { ApiCategory } from "../types/api";

interface CategoriesContextValue {
  categories: ApiCategory[];
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({
  children,
  initialCategories = [],
}: {
  children: ReactNode;
  initialCategories?: ApiCategory[];
}) {
  return (
    <CategoriesContext.Provider value={{ categories: initialCategories }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): ApiCategory[] {
  const ctx = useContext(CategoriesContext);
  return ctx?.categories ?? [];
}
