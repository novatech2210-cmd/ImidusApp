"use client";

import { useCart } from "@/context/CartContext";
import { MenuAPI, Category, MenuItem } from "@/lib/api";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useState } from "react";
import { MenuItemCard } from "@/components/MenuItemCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SkeletonGrid } from "@/components/SkeletonCard";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setError("");
      const data = await MenuAPI.getCategories();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCat(data[0].categoryId);
        loadItems(data[0].categoryId);
      } else {
        setLoading(false);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Could not load menu categories: ${errorMsg}`);
      console.error("Menu categories error:", err);
      setLoading(false);
    }
  };

  const loadItems = async (categoryId: number) => {
    try {
      setLoading(true);
      setError("");
      const data = await MenuAPI.getItemsByCategory(categoryId);
      setItems(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Could not load menu items: ${errorMsg}`);
      console.error("Menu items error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = useCallback((categoryId: number | null) => {
    if (categoryId !== null) {
      setSelectedCat(categoryId);
      loadItems(categoryId);
    }
  }, []);

  const handleAddToCart = useCallback(
    (item: MenuItem) => {
      // Add first available size by default
      const availableSize = item.sizes.find((s) => s.inStock) || item.sizes[0];
      if (availableSize) {
        addItem({
          menuItemId: item.itemId,
          sizeId: availableSize.sizeId,
          name: item.name,
          sizeName: availableSize.sizeName,
          price: availableSize.price,
          categoryName:
            categories.find((c) => c.categoryId === selectedCat)?.name || "",
        });
      }
    },
    [addItem, categories, selectedCat]
  );

  const handleRetry = () => {
    setError("");
    loadCategories();
  };

  const activeCategory = categories.find((c) => c.categoryId === selectedCat);

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      {/* Category Filter - Horizontal scrolling tabs (mobile-optimized) */}
      <div className="md:hidden">
        <CategoryFilter
          categories={categories}
          selectedId={selectedCat}
          onSelect={handleCategorySelect}
        />
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Category Sidebar - Desktop only */}
        <div className="hidden md:block w-64 flex-shrink-0 category-sidebar rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[rgba(30,90,168,0.08)]">
            <p className="text-[10px] font-black uppercase text-[#71717A] tracking-[0.15em]">
              Categories
            </p>
          </div>
          <div className="overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat.categoryId}
                onClick={() => handleCategorySelect(cat.categoryId)}
                className={`w-full text-left category-item ${
                  selectedCat === cat.categoryId ? "active" : ""
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto px-2 md:px-0">
          {/* Error State with Retry */}
          {error && (
            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center justify-between gap-4 text-red-200">
              <div className="flex items-center gap-4">
                <span className="text-2xl">!</span>
                <div>
                  <p className="text-xs font-bold uppercase">Connection Error</p>
                  <p className="text-[10px] opacity-70">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-sm font-medium"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {/* Loading State - Skeleton Cards */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              <SkeletonGrid count={8} />
            </div>
          ) : (
            <>
              {/* Category Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#1E5AA8] tracking-tight">
                  {activeCategory?.name || "Menu"}
                </h2>
                <p className="text-sm text-[#71717A] mt-1">
                  {items.length} {items.length === 1 ? "item" : "items"} available
                </p>
              </div>

              {/* Responsive Item Grid */}
              {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.itemId}
                      item={item}
                      categoryId={selectedCat}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-16 rounded-xl bg-[var(--bg-surface)] border border-[var(--divider)]">
                  <div className="text-5xl mb-4 opacity-30">🍽️</div>
                  <p className="text-[#71717A] font-medium">
                    No items available in this category
                  </p>
                  <p className="text-xs text-[#71717A] mt-2 opacity-70">
                    Please select another category or check back later
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
