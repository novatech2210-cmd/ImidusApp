"use client";

import { AdminAPI, MenuOverride } from "@/lib/api";
import {
    CheckCircleIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<MenuOverride | null>(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const data = await AdminAPI.getMenuOverrides();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch menu overrides:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOverride = async (
    itemId: number,
    updates: Partial<MenuOverride>,
  ) => {
    try {
      await AdminAPI.updateMenuOverride(itemId, updates);
      fetchMenu();
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to update override:", error);
      alert("Failed to update menu item.");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.overrideName &&
        item.overrideName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filter === "unavailable") return matchesSearch && !item.isAvailable;
    if (filter === "hidden") return matchesSearch && item.hiddenFromOnline;
    if (filter === "overridden")
      return matchesSearch && (item.overridePrice > 0 || item.overrideName);

    return matchesSearch;
  });

  if (loading)
    return (
      <div className="p-8">
        <div className="animate-pulse h-12 bg-gray-800 rounded mb-4" />
        <div className="animate-pulse h-64 bg-gray-800 rounded" />
      </div>
    );

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Menu Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Override item availability, prices, and names for online ordering
          </p>
        </div>
        <button
          onClick={fetchMenu}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter menu items"
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="all">All Items</option>
          <option value="unavailable">Unavailable</option>
          <option value="hidden">Hidden Online</option>
          <option value="overridden">With Overrides</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.itemId}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  {item.overrideName || item.itemName}
                </h3>
                {item.overrideName && (
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    Original: {item.itemName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditingItem(item)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <PencilSquareIcon className="w-4 h-4 text-blue-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold uppercase">
                  Status
                </span>
                {item.isAvailable ? (
                  <span className="flex items-center text-xs text-green-500 font-bold">
                    <CheckCircleIcon className="w-4 h-4 mr-1" /> Available
                  </span>
                ) : (
                  <span className="flex items-center text-xs text-red-500 font-bold">
                    <XCircleIcon className="w-4 h-4 mr-1" /> Unavailable
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold uppercase">
                  Visibility
                </span>
                {item.hiddenFromOnline ? (
                  <span className="text-xs text-yellow-500 font-bold">
                    Hidden
                  </span>
                ) : (
                  <span className="text-xs text-blue-500 font-bold">
                    Visible
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold uppercase">
                  Price Override
                </span>
                <span className="text-sm font-mono text-white">
                  {item.overridePrice > 0
                    ? `$${(item.overridePrice / 100).toFixed(2)}`
                    : "None"}
                </span>
              </div>
            </div>

            {/* Quick Toggle Overlay */}
            <div className="mt-6 flex gap-2">
              <button
                onClick={() =>
                  handleUpdateOverride(item.itemId, {
                    isAvailable: !item.isAvailable,
                  })
                }
                className={`flex-1 py-1 px-3 rounded text-[10px] font-bold uppercase transition-colors ${
                  item.isAvailable
                    ? "bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50"
                    : "bg-green-900/30 text-green-400 border border-green-800 hover:bg-green-900/50"
                }`}
              >
                {item.isAvailable ? "Mark Unavailable" : "Mark Available"}
              </button>
              <button
                onClick={() =>
                  handleUpdateOverride(item.itemId, {
                    hiddenFromOnline: !item.hiddenFromOnline,
                  })
                }
                className="flex-1 py-1 px-3 bg-gray-800 text-gray-400 border border-gray-700 rounded text-[10px] font-bold uppercase hover:bg-gray-700 transition-colors"
              >
                {item.hiddenFromOnline ? "Show Online" : "Hide Online"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-8 space-y-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              Edit Menu Item
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1 block">
                  Display Name Override
                </label>
                <input
                  type="text"
                  defaultValue={editingItem.overrideName || ""}
                  id="edit-name"
                  placeholder={editingItem.itemName}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1 block">
                  Price Override (Cents)
                </label>
                <input
                  type="number"
                  defaultValue={editingItem.overridePrice || 0}
                  id="edit-price"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-lg uppercase text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = (
                    document.getElementById("edit-name") as HTMLInputElement
                  ).value;
                  const price = parseInt(
                    (document.getElementById("edit-price") as HTMLInputElement)
                      .value,
                  );
                  handleUpdateOverride(editingItem.itemId, {
                    overrideName: name || undefined,
                    overridePrice: price,
                  });
                }}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg uppercase text-xs hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
