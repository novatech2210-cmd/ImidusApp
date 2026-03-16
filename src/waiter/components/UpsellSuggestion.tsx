'use client';

import { useState } from 'react';
import Image from 'next/image';

interface UpsellSuggestionProps {
  suggestion: {
    itemId: string;
    itemName: string;
    itemPrice: number;
    discountPercent?: number;
    finalPrice: number;
    message?: string;
    imageUrl?: string;
  };
  onAccept: (itemId: string) => void;
  onDecline: (itemId: string) => void;
}

export default function UpsellSuggestion({
  suggestion,
  onAccept,
  onDecline
}: UpsellSuggestionProps) {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) return null;
  
  const savings = suggestion.itemPrice - suggestion.finalPrice;
  
  const handleAccept = () => {
    onAccept(suggestion.itemId);
    setDismissed(true);
  };
  
  const handleDecline = () => {
    onDecline(suggestion.itemId);
    setDismissed(true);
  };
  
  return (
    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-4">
        {/* Item Image */}
        {suggestion.imageUrl && (
          <div className="flex-shrink-0">
            <Image
              src={suggestion.imageUrl}
              alt={suggestion.itemName}
              width={80}
              height={80}
              className="rounded-lg object-cover"
            />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1">
          <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">
            You might also like...
          </p>
          <h3 className="text-lg font-bold text-gray-900">
            {suggestion.itemName}
          </h3>
          
          {suggestion.message && (
            <p className="text-sm text-gray-600 mt-1">
              {suggestion.message}
            </p>
          )}
          
          {/* Pricing */}
          <div className="flex items-baseline gap-2 mt-2">
            {savings > 0 ? (
              <>
                <span className="text-xl font-bold text-orange-600">
                  ${suggestion.finalPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ${suggestion.itemPrice.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-green-600">
                  Save ${savings.toFixed(2)}
                  {suggestion.discountPercent && ` (${suggestion.discountPercent}% off)`}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-gray-900">
                ${suggestion.finalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleAccept}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Add to Order
          </button>
          <button
            onClick={handleDecline}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
