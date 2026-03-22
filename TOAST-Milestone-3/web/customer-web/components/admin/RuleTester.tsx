'use client';

import React, { useState } from 'react';

interface Rule {
  id: string;
  name: string;
  priority: number;
  active: boolean;
  conditions: any;
  suggestions: any[];
  constraints?: any;
}

interface RuleTesterProps {
  rules: Rule[];
  onClose: () => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export default function RuleTester({ rules, onClose }: RuleTesterProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [currentTime, setCurrentTime] = useState('lunch');
  const [currentDay, setCurrentDay] = useState('monday');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('all');

  const addCartItem = () => {
    const newItem: CartItem = {
      id: `test-${Date.now()}`,
      name: `Test Item ${cartItems.length + 1}`,
      price: 5.00,
      quantity: 1,
      category: 'burgers'
    };
    setCartItems([...cartItems, newItem]);
    setCartTotal(cartTotal + newItem.price);
  };

  const updateCartItem = (index: number, field: keyof CartItem, value: any) => {
    const newItems = [...cartItems];
    const oldPrice = newItems[index].price * newItems[index].quantity;
    
    if (field === 'price' || field === 'quantity') {
      const newPrice = field === 'price' ? value * newItems[index].quantity : newItems[index].price * value;
      setCartTotal(cartTotal - oldPrice + newPrice);
    }
    
    newItems[index] = { ...newItems[index], [field]: value };
    setCartItems(newItems);
  };

  const removeCartItem = (index: number) => {
    const removedItem = cartItems[index];
    setCartTotal(cartTotal - (removedItem.price * removedItem.quantity));
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const evaluateRules = () => {
    const results: any[] = [];
    const activeRules = rules.filter(r => r.active);
    const rulesToTest = selectedRuleId === 'all' 
      ? activeRules 
      : activeRules.filter(r => r.id === selectedRuleId);

    rulesToTest.forEach(rule => {
      const matched = evaluateRule(rule);
      results.push({
        rule,
        matched,
        suggestions: matched ? rule.suggestions : []
      });
    });

    setTestResults(results.sort((a, b) => b.rule.priority - a.rule.priority));
  };

  const evaluateRule = (rule: Rule): boolean => {
    const conditions = rule.conditions || {};
    
    // Check IF cart contains
    if (conditions.if_cart_contains) {
      const { item_id, item_category, min_quantity, max_quantity } = conditions.if_cart_contains;
      
      if (item_id) {
        const matchingItem = cartItems.find(item => item.id === item_id);
        if (!matchingItem) return false;
        if (min_quantity && matchingItem.quantity < min_quantity) return false;
        if (max_quantity && matchingItem.quantity > max_quantity) return false;
      }
      
      if (item_category) {
        const matchingItems = cartItems.filter(item => item.category === item_category);
        if (matchingItems.length === 0) return false;
        if (min_quantity && matchingItems.reduce((sum, item) => sum + item.quantity, 0) < min_quantity) return false;
      }
    }
    
    // Check AND cart missing
    if (conditions.and_cart_missing) {
      const { item_id, item_category } = conditions.and_cart_missing;
      
      if (item_id) {
        const matchingItem = cartItems.find(item => item.id === item_id);
        if (matchingItem) return false;
      }
      
      if (item_category) {
        const matchingItems = cartItems.filter(item => item.category === item_category);
        if (matchingItems.length > 0) return false;
      }
    }
    
    // Check IF cart total
    if (conditions.if_cart_total) {
      const { min, max } = conditions.if_cart_total;
      if (min !== undefined && cartTotal < min) return false;
      if (max !== undefined && cartTotal > max) return false;
    }
    
    // Check constraints
    if (rule.constraints) {
      const { min_cart_value, max_cart_value, time_of_day, days_of_week } = rule.constraints;
      
      if (min_cart_value !== undefined && cartTotal < min_cart_value) return false;
      if (max_cart_value !== undefined && cartTotal > max_cart_value) return false;
      
      if (time_of_day && time_of_day.length > 0 && !time_of_day.includes(currentTime)) {
        return false;
      }
      
      if (days_of_week && days_of_week.length > 0 && !days_of_week.includes(currentDay)) {
        return false;
      }
    }
    
    return true;
  };

  return (
    <div className="rule-tester space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Cart Simulator */}
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-3">Cart Simulator</h3>
          
          <div className="space-y-2 mb-4">
            {cartItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateCartItem(index, 'name', e.target.value)}
                  className="flex-1 p-1 border rounded text-sm"
                  placeholder="Item name"
                />
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateCartItem(index, 'price', parseFloat(e.target.value))}
                  className="w-20 p-1 border rounded text-sm"
                  step="0.01"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateCartItem(index, 'quantity', parseInt(e.target.value))}
                  className="w-16 p-1 border rounded text-sm"
                  min="1"
                />
                <select
                  value={item.category}
                  onChange={(e) => updateCartItem(index, 'category', e.target.value)}
                  className="p-1 border rounded text-sm"
                >
                  <option value="burgers">Burgers</option>
                  <option value="sides">Sides</option>
                  <option value="drinks">Drinks</option>
                  <option value="desserts">Desserts</option>
                </select>
                <button
                  onClick={() => removeCartItem(index)}
                  className="text-red-500 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={addCartItem}
            className="w-full p-2 border-2 border-dashed rounded text-gray-500 hover:border-blue-500 hover:text-blue-500"
          >
            + Add Item to Cart
          </button>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between font-semibold">
              <span>Cart Total:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* Context Settings */}
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-3">Context Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Time of Day</label>
              <select
                value={currentTime}
                onChange={(e) => setCurrentTime(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Day of Week</label>
              <select
                value={currentDay}
                onChange={(e) => setCurrentDay(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Test Specific Rule</label>
              <select
                value={selectedRuleId}
                onChange={(e) => setSelectedRuleId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="all">All Active Rules</option>
                {rules.filter(r => r.active).map(rule => (
                  <option key={rule.id} value={rule.id}>
                    {rule.name} (Priority: {rule.priority})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Evaluate Button */}
      <button
        onClick={evaluateRules}
        className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
      >
        Evaluate Rules
      </button>
      
      {/* Results */}
      {testResults.length > 0 && (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-3">Evaluation Results</h3>
          
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded ${
                  result.matched ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${result.matched ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">{result.rule.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">Priority: {result.rule.priority}</span>
                </div>
                
                {result.matched ? (
                  <div className="text-sm">
                    <div className="text-green-700 mb-2">✓ Rule matched</div>
                    <div className="font-medium mb-1">Suggestions:</div>
                    <ul className="list-disc list-inside ml-2">
                      {result.suggestions.map((suggestion: any, i: number) => (
                        <li key={i}>
                          Item: {suggestion.pos_item_id}
                          {suggestion.discount_percent && ` (${suggestion.discount_percent}% off)`}
                          {suggestion.message && ` - "${suggestion.message}"`}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-sm text-red-700">
                    ✗ Rule did not match conditions
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Close Button */}
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Close
        </button>
      </div>
    </div>
  );
}
