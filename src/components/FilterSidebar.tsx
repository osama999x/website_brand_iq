"use client";

import { useState } from "react";
import { useCategories } from "../context/CategoriesContext";
import type { ApiFilterOptions } from "../types/api";

const FALLBACK_GENDERS = ["men", "women", "juniors"];

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Selected category/subcategory from API (for products list) */
  selectedCategoryId?: string | null;
  selectedSubCategoryId?: string | null;
  onCategoryChange?: (categoryId: string | null, subCategoryId: string | null) => void;

  filterOptions?: ApiFilterOptions | null;
  selectedGender?: string | null;
  onGenderChange?: (gender: string | null) => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-neutral-200 py-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left cursor-pointer"
      >
        <span className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900">
          {title}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
}

export default function FilterSidebar({
  isOpen,
  onClose,
  selectedCategoryId = null,
  selectedSubCategoryId = null,
  onCategoryChange,
  filterOptions = null,
  selectedGender = null,
  onGenderChange,
}: FilterSidebarProps) {
  const categories = useCategories();
  const optCategories = filterOptions?.categories ?? categories;
  const optSubcategories = filterOptions?.subcategories ?? [];
  const optGenders = filterOptions?.genders?.length ? filterOptions.genders : FALLBACK_GENDERS;

  const hasActiveFilters =
    selectedCategoryId != null ||
    selectedSubCategoryId != null ||
    selectedGender != null;

  function clearAll() {
    onCategoryChange?.(null, null);
    onGenderChange?.(null);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="flex items-center justify-between pb-5 border-b border-neutral-200">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-900">
          Filters
        </span>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-neutral-500 underline hover:text-neutral-900 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
          {/* Close button — visible on mobile only */}
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="lg:hidden text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Filter sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Category — from API when available */}
        <FilterSection title="Category">
          <label className="flex items-center gap-2.5 cursor-pointer group/label">
            <input
              type="radio"
              name="filter-category"
              checked={selectedCategoryId == null && selectedSubCategoryId == null}
              onChange={() => onCategoryChange?.(null, null)}
              className="h-4 w-4 border-neutral-400 accent-neutral-900 cursor-pointer"
            />
            <span className="text-sm text-neutral-700 group-hover/label:text-neutral-900 transition-colors">
              All
            </span>
          </label>
          {optCategories.map((cat) => (
            <div key={cat._id} className="space-y-1">
              <label className="flex items-center gap-2.5 cursor-pointer group/label">
                <input
                  type="radio"
                  name="filter-category"
                  checked={selectedCategoryId === cat._id && selectedSubCategoryId == null}
                  onChange={() => onCategoryChange?.(cat._id, null)}
                  className="h-4 w-4 border-neutral-400 accent-neutral-900 cursor-pointer"
                />
                <span className="text-sm text-neutral-700 group-hover/label:text-neutral-900 transition-colors">
                  {cat.name}
                </span>
              </label>
              {/* If backend filterOptions supplies a separate subcategories list */}
              {optSubcategories.length > 0 ? (
                <div className="ml-6 space-y-1">
                  {optSubcategories
                    .filter((s) => String((s as { category?: unknown }).category) === String(cat._id))
                    .map((sub) => (
                    <label
                      key={sub._id}
                      className="flex items-center gap-2.5 cursor-pointer group/label"
                    >
                      <input
                        type="radio"
                        name="filter-category"
                        checked={
                          selectedCategoryId === cat._id && selectedSubCategoryId === sub._id
                        }
                        onChange={() => onCategoryChange?.(cat._id, sub._id)}
                        className="h-4 w-4 border-neutral-400 accent-neutral-900 cursor-pointer"
                      />
                      <span className="text-sm text-neutral-500 group-hover/label:text-neutral-900 transition-colors">
                        {sub.name}
                      </span>
                    </label>
                  ))}
                </div>
              ) : "subCategory" in cat &&
                Array.isArray((cat as { subCategory?: unknown }).subCategory) &&
                (cat as { subCategory: Array<{ _id: string; name: string }> }).subCategory.length ? (
                <div className="ml-6 space-y-1">
                  {(cat as { subCategory: Array<{ _id: string; name: string }> }).subCategory.map((sub) => (
                    <label
                      key={sub._id}
                      className="flex items-center gap-2.5 cursor-pointer group/label"
                    >
                      <input
                        type="radio"
                        name="filter-category"
                        checked={
                          selectedCategoryId === cat._id && selectedSubCategoryId === sub._id
                        }
                        onChange={() => onCategoryChange?.(cat._id, sub._id)}
                        className="h-4 w-4 border-neutral-400 accent-neutral-900 cursor-pointer"
                      />
                      <span className="text-sm text-neutral-500 group-hover/label:text-neutral-900 transition-colors">
                        {sub.name}
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </FilterSection>

        {/* Gender */}
        <FilterSection title="Gender">
          <label className="flex items-center gap-2.5 cursor-pointer group/label">
            <input
              type="radio"
              name="gender"
              checked={selectedGender == null}
              onChange={() => onGenderChange?.(null)}
              className="h-4 w-4 border-neutral-400 accent-neutral-900 cursor-pointer"
            />
            <span className="text-sm text-neutral-700 group-hover/label:text-neutral-900 transition-colors">
              All
            </span>
          </label>
          {optGenders.map((g) => (
            <label key={g} className="flex items-center gap-2.5 cursor-pointer group/label">
              <input
                type="radio"
                name="gender"
                checked={selectedGender === g}
                onChange={() => onGenderChange?.(g)}
                className="h-4 w-4 border-neutral-400 accent-neutral-900 cursor-pointer"
              />
              <span className="text-sm text-neutral-700 group-hover/label:text-neutral-900 transition-colors">
                {g}
              </span>
            </label>
          ))}
        </FilterSection>

      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — always visible at lg+ */}
      <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white px-5 py-6 overflow-y-auto lg:hidden shadow-xl">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
