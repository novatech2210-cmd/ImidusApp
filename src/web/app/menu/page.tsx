"use client";

import { useCart } from "@/context/CartContext";
import { MenuAPI, MenuCategory } from "@/lib/api";
import { CheckIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [added, setAdded] = useState<number | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    MenuAPI.getFullMenu()
      .then((data) => {
        const cats: MenuCategory[] = Array.isArray(data)
          ? data
          : data.categories || [];
        setMenu(cats);
        if (cats.length) setSelectedCat(cats[0].categoryId);
      })
      .catch(() =>
        setError(
          "Could not load menu — ensure the backend is running at http://localhost:5000",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = (item: any) => {
    addItem({
      menuItemId: item.menuItemId,
      name: item.itemName,
      price: item.price,
      categoryName: item.categoryName,
    });
    setAdded(item.menuItemId);
    setTimeout(() => setAdded(null), 1200);
  };

  const activeCategory = menu.find((c) => c.categoryId === selectedCat);
  const displayMenu = menu.length > 0 ? menu : DEMO_MENU;
  const currentItems =
    activeCategory?.items ||
    displayMenu.find((c) => c.categoryId === selectedCat)?.items ||
    displayMenu[0].items;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex gap-8">
        {/* Category Selector (Inner) */}
        <div className="w-48 flex-shrink-0 space-y-2">
          <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-4">
            Categories
          </p>
          {displayMenu
            .filter((c) => c.isActive !== false)
            .map((cat) => (
              <button
                key={cat.categoryId}
                onClick={() => setSelectedCat(cat.categoryId)}
                className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-all border-l-4 ${
                  selectedCat === cat.categoryId
                    ? "bg-bg-surface border-gold text-white shadow-lg"
                    : "border-transparent text-text-secondary hover:bg-bg-active"
                }`}
              >
                {cat.categoryName}
              </button>
            ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {error && (
            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-4 text-red-200">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-xs font-bold uppercase">
                  Backend Connection Warning
                </p>
                <p className="text-[10px] opacity-70">
                  Showing demo items. Reconnect to sync real POS data.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-40" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {currentItems.map((item) => (
                <div
                  key={item.menuItemId}
                  className="product-tile group animate-in zoom-in-95 duration-200"
                  onClick={() => handleAdd(item)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-black text-white uppercase text-sm leading-tight group-hover:text-gold transition-colors">
                        {item.itemName}
                      </h3>
                      {item.description && (
                        <p className="text-[10px] text-text-dim mt-1 line-clamp-2 uppercase">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="text-gold-vibrant font-black font-mono text-sm ml-2">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-auto flex justify-between items-end">
                    <div className="flex gap-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-green-500"
                        title="In Stock"
                      />
                    </div>
                    <div
                      className={`p-2 rounded-full transition-all ${added === item.menuItemId ? "bg-green-500 text-white" : "bg-bg-active text-text-dim group-hover:bg-gold group-hover:text-black"}`}
                    >
                      {added === item.menuItemId ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        <PlusIcon className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Subtle hover backlight */}
                  <div className="absolute inset-0 bg-blue-vibrant/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DEMO_MENU: MenuCategory[] = [
  {
    categoryId: 1,
    categoryName: "Burgers",
    isActive: true,
    itemCount: 3,
    items: [
      {
        menuItemId: 1,
        itemName: "Classic Smash Burger",
        price: 14.99,
        categoryId: 1,
        categoryName: "Burgers",
        isAvailable: true,
        description:
          "Double smash patty, American cheese, pickles, special sauce",
      },
      {
        menuItemId: 2,
        itemName: "BBQ Bacon Burger",
        price: 16.99,
        categoryId: 1,
        categoryName: "Burgers",
        isAvailable: true,
        description: "Crispy bacon, BBQ sauce, caramelized onions",
      },
    ],
  },
  {
    categoryId: 2,
    categoryName: "Drinks",
    isActive: true,
    itemCount: 2,
    items: [
      {
        menuItemId: 9,
        itemName: "Craft Lemonade",
        price: 4.99,
        categoryId: 4,
        categoryName: "Drinks",
        isAvailable: true,
      },
    ],
  },
];
