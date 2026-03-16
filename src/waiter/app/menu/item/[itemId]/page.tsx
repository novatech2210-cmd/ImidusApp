'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { MenuAPI, MenuItem } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { ArrowLeftIcon, PlusIcon, MinusIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';

export default function ItemDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const itemId = parseInt(params.itemId as string);
  const categoryId = searchParams.get('category');
  
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  
  const { addItem } = useCart();

  useEffect(() => {
    if (itemId && categoryId) {
      loadItem();
    }
  }, [itemId, categoryId]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const items = await MenuAPI.getItemsByCategory(parseInt(categoryId!));
      const foundItem = items.find(i => i.itemId === itemId);
      if (foundItem) {
        setItem(foundItem);
        // Select first available size by default
        const availableSize = foundItem.sizes.find(s => s.inStock);
        if (availableSize) {
          setSelectedSize(availableSize.sizeId);
        }
      } else {
        setError('Item not found');
      }
    } catch (err) {
      setError('Failed to load item details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!item || !selectedSize) return;
    
    const size = item.sizes.find(s => s.sizeId === selectedSize);
    if (!size) return;

    addItem({
      menuItemId: item.itemId,
      sizeId: size.sizeId,
      name: item.name,
      sizeName: size.sizeName,
      price: size.price,
      image: item.imageUrl,
      categoryName: '', // Will be set from menu page
    });

    // Add multiple quantities if needed
    for (let i = 1; i < quantity; i++) {
      addItem({
        menuItemId: item.itemId,
        sizeId: size.sizeId,
        name: item.name,
        sizeName: size.sizeName,
        price: size.price,
        image: item.imageUrl,
        categoryName: '',
      });
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold text-[#1E5AA8]">Loading item...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-600 mb-4">{error || 'Item not found'}</p>
          <Link href="/menu" className="text-[#1E5AA8] hover:underline">
            ← Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const selectedSizeObj = item.sizes.find(s => s.sizeId === selectedSize);
  const itemTotal = (selectedSizeObj?.price || 0) * quantity;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back Button */}
      <Link 
        href="/menu" 
        className="inline-flex items-center gap-2 text-[#1E5AA8] hover:text-[#D4AF37] mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span className="font-semibold">Back to Menu</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="h-80 md:h-full bg-gradient-to-br from-[#D6E4F7] to-[#FDF6E3] flex items-center justify-center p-8">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center">
                <span className="text-8xl">🍽️</span>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">{item.name}</h1>
            
            {item.description && (
              <p className="text-gray-600 mb-6">{item.description}</p>
            )}

            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Select Size
              </h3>
              <div className="space-y-2">
                {item.sizes.map((size) => (
                  <button
                    key={size.sizeId}
                    onClick={() => size.inStock && setSelectedSize(size.sizeId)}
                    disabled={!size.inStock}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      selectedSize === size.sizeId
                        ? 'border-[#D4AF37] bg-[#FDF6E3]'
                        : size.inStock
                        ? 'border-gray-200 hover:border-[#1E5AA8]'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedSize === size.sizeId
                          ? 'border-[#D4AF37] bg-[#D4AF37]'
                          : 'border-gray-300'
                      }`}>
                        {selectedSize === size.sizeId && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="font-medium text-gray-800">
                        {size.sizeName}
                        {!size.inStock && (
                          <span className="ml-2 text-xs text-red-500">(Out of Stock)</span>
                        )}
                      </span>
                    </div>
                    <span className="font-bold text-[#D4AF37]">
                      ${size.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Quantity
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <MinusIcon className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-2xl font-bold text-gray-800 w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <PlusIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Price & Add to Cart */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Total</span>
                <span className="text-3xl font-bold text-[#D4AF37]">
                  ${itemTotal.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || !selectedSizeObj?.inStock || added}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-[#1E5AA8] hover:bg-[#D4AF37] text-white'
                } ${(!selectedSize || !selectedSizeObj?.inStock) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {added ? (
                  <>
                    <ShoppingCartIcon className="w-6 h-6" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCartIcon className="w-6 h-6" />
                    Add to Cart
                  </>
                )}
              </button>

              {!item.isAvailable && (
                <p className="text-center text-red-500 mt-3 text-sm">
                  This item is currently unavailable
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
