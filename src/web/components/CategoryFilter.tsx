"use client";

import { Category } from "@/lib/api";
import { useRef, useEffect } from "react";

interface CategoryFilterProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (categoryId: number | null) => void;
  showAllOption?: boolean;
  itemCounts?: Record<number, number>;
}

/**
 * Horizontal scrolling category filter component.
 * Features:
 * - Horizontal scroll on mobile (hidden scrollbar, snap to items)
 * - Active state: brand blue background, white text
 * - Inactive state: dark surface, secondary text
 * - Touch-friendly buttons (44px min height)
 * - Auto-scrolls selected category into view
 * - Optional "All" button at start
 * - Optional item counts per category
 */
export function CategoryFilter({
  categories,
  selectedId,
  onSelect,
  showAllOption = false,
  itemCounts,
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll selected category into view when selection changes
  useEffect(() => {
    if (scrollRef.current && selectedId !== null) {
      const selectedButton = scrollRef.current.querySelector(
        `[data-category-id="${selectedId}"]`
      );
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedId]);

  return (
    <div className="sticky top-0 z-10 bg-[var(--bg-main)] py-3">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-1"
        role="tablist"
        aria-label="Menu categories"
      >
        {/* Optional "All" button */}
        {showAllOption && (
          <button
            onClick={() => onSelect(null)}
            role="tab"
            aria-selected={selectedId === null}
            className={`category-tab flex-shrink-0 snap-start ${
              selectedId === null ? "active" : ""
            }`}
          >
            All
          </button>
        )}

        {/* Category buttons */}
        {categories.map((category) => (
          <button
            key={category.categoryId}
            data-category-id={category.categoryId}
            onClick={() => onSelect(category.categoryId)}
            role="tab"
            aria-selected={selectedId === category.categoryId}
            className={`category-tab flex-shrink-0 snap-start ${
              selectedId === category.categoryId ? "active" : ""
            }`}
          >
            {category.name}
            {itemCounts && itemCounts[category.categoryId] !== undefined && (
              <span className="ml-1.5 text-xs opacity-70">
                ({itemCounts[category.categoryId]})
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryFilter;
