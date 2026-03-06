"use client";

import { useCart } from "@/context/CartContext";
import { MenuAPI, Category, MenuItem } from "@/lib/api";
import { CheckIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [added, setAdded] = useState<number | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await MenuAPI.getCategories();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCat(data[0].categoryId);
        loadItems(data[0].categoryId);
      }
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      setError(`Could not load menu categories: ${errorMsg}`);
      console.error("Menu categories error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (categoryId: number) => {
    try {
      setLoading(true);
      const data = await MenuAPI.getItemsByCategory(categoryId);
      setItems(data);
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      setError(`Could not load menu items: ${errorMsg}`);
      console.error("Menu items error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCat(categoryId);
    loadItems(categoryId);
  };

  const handleQuickAdd = (item: MenuItem) => {
    // Add first available size by default
    const availableSize = item.sizes.find(s => s.inStock) || item.sizes[0];
    if (availableSize) {
      addItem({
        menuItemId: item.itemId,
        sizeId: availableSize.sizeId,
        name: item.name,
        sizeName: availableSize.sizeName,
        price: availableSize.price,
        categoryName: categories.find(c => c.categoryId === selectedCat)?.name || '',
      });
      setAdded(item.itemId);
      setTimeout(() => setAdded(null), 1200);
    }
  };

  const activeCategory = categories.find((c) => c.categoryId === selectedCat);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Category Sidebar */}
        <div className="w-64 flex-shrink-0 category-sidebar rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[rgba(30,90,168,0.08)]">
            <p className="text-[10px] font-black uppercase text-[#71717A] tracking-[0.15em]">
              Categories
            </p>
          </div>
          <div className="overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat.categoryId}
                onClick={() => handleCategoryClick(cat.categoryId)}
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
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-4 text-red-200">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-xs font-bold uppercase">Connection Error</p>
                <p className="text-[10px] opacity-70">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card h-52 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#1E5AA8] tracking-tight">
                  {activeCategory?.name || "Menu"}
                </h2>
                <p className="text-sm text-[#71717A] mt-1">{items.length} items available</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div key={item.itemId} className="product-card">
                    {/* Item Image/Icon */}
                    <Link href={`/menu/item/${item.itemId}?category=${selectedCat}`}>
                      <div className="product-image h-40">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-5xl opacity-40">🍽️</span>
                        )}
                      </div>
                    </Link>

                    <div className="product-info">
                      <Link href={`/menu/item/${item.itemId}?category=${selectedCat}`}>
                        <h3 className="product-name hover:text-[#1E5AA8] transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      
                      {item.description && (
                        <p className="product-description line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <span className="product-price">
                          ${item.sizes[0]?.price.toFixed(2) || '0.00'}
                        </span>
                        
                        <button
                          onClick={() => handleQuickAdd(item)}
                          disabled={!item.isAvailable || !item.sizes.some(s => s.inStock)}
                          className={`btn btn-gold w-10 h-10 p-0 rounded-full ${
                            added === item.itemId ? "!bg-green-600 !text-white" : ""
                          } ${(!item.isAvailable || !item.sizes.some(s => s.inStock)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {added === item.itemId ? (
                            <CheckIcon className="w-5 h-5" />
                          ) : (
                            <PlusIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {!item.isAvailable && (
                        <span className="badge badge-error mt-3">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {items.length === 0 && !loading && (
                <div className="text-center py-16 card">
                  <p className="text-[#71717A] font-medium">No items available in this category</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
