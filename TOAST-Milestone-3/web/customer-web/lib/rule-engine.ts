import { overlayDb } from './db';

export interface Cart {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  total: number;
}

export interface EvaluatedSuggestion {
  ruleId: string;
  ruleName: string;
  priority: number;
  suggestion: {
    itemId: string;
    itemName: string;
    itemPrice: number;
    discountPercent?: number;
    discountAmount?: number;
    finalPrice: number;
    message?: string;
    imageUrl?: string;
  };
}

interface POSItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
  image_url?: string;
}

/**
 * Fetch active rules from overlay database
 */
async function getActiveRules(): Promise<any[]> {
  const result = await overlayDb.query(`
    SELECT id, name, priority, conditions, suggestions, constraints
    FROM upselling_rules
    WHERE active = 1
    ORDER BY priority DESC
  `);
  return result.rows;
}

/**
 * Validate and fetch item from POS (read-only)
 */
async function validateAndFetchPOSItem(posItemId: string): Promise<POSItem | null> {
  try {
    // Read POS data via backend API (INI_Restaurant remains SSOT)
    const response = await fetch(
      `/api/pos?action=validate&itemId=${encodeURIComponent(posItemId)}`,
      { method: 'GET', cache: 'no-store' }
    );

    if (!response.ok) {
      return null;
    }

    const validation = await response.json();

    if (!validation.valid || !validation.item) {
      return null;
    }

    return {
      id: validation.item.id,
      name: validation.item.name,
      price: validation.item.price,
      available: validation.item.available,
      image_url: validation.item.image_url
    };
  } catch (error) {
    console.error('Error fetching POS item:', error);
    return null;
  }
}

/**
 * Evaluate all active rules against cart
 * Returns up to 2 suggestions ordered by priority
 */
export async function evaluateUpsellRules(
  cart: Cart,
  sessionId: string,
  customerId?: string
): Promise<EvaluatedSuggestion[]> {
  // Fetch active rules from overlay DB
  const rules = await getActiveRules();
  
  const suggestions: EvaluatedSuggestion[] = [];
  
  for (const rule of rules) {
    // Check constraints first (time, day, cart value)
    if (!meetsConstraints(rule, cart)) {
      continue;
    }
    
    // Evaluate conditions
    if (evaluateConditions(rule.conditions, cart)) {
      // Validate suggested items from POS
      for (const suggestion of rule.suggestions) {
        const posItem = await validateAndFetchPOSItem(suggestion.pos_item_id);
        
        if (!posItem || !posItem.available) {
          continue; // Skip unavailable items
        }
        
        // Calculate final price with discount
        let finalPrice = posItem.price;
        if (suggestion.discount_percent) {
          finalPrice = posItem.price * (1 - suggestion.discount_percent / 100);
        } else if (suggestion.discount_amount) {
          finalPrice = posItem.price - suggestion.discount_amount;
        }
        
        suggestions.push({
          ruleId: rule.id,
          ruleName: rule.name,
          priority: rule.priority,
          suggestion: {
            itemId: posItem.id,
            itemName: posItem.name,
            itemPrice: posItem.price,
            discountPercent: suggestion.discount_percent,
            discountAmount: suggestion.discount_amount,
            finalPrice,
            message: suggestion.message,
            imageUrl: posItem.image_url
          }
        });
        
        // Track impression
        await trackImpression({
          ruleId: rule.id,
          sessionId,
          customerId,
          cartItems: cart.items,
          cartTotal: cart.total,
          suggestedItemId: posItem.id,
          suggestedItemName: posItem.name,
          suggestedItemPrice: posItem.price,
          discountApplied: posItem.price - finalPrice
        });
      }
    }
    
    // Max 2 suggestions
    if (suggestions.length >= 2) break;
  }
  
  // Sort by priority (already sorted from DB, but ensure)
  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 2);
}

/**
 * Evaluate rule conditions against cart
 */
function evaluateConditions(conditions: any, cart: Cart): boolean {
  // IF cart contains
  if (conditions.if_cart_contains) {
    const { item_id, item_category, min_quantity } = conditions.if_cart_contains;
    
    let matches = false;
    
    if (item_id) {
      // Check specific item
      const item = cart.items.find(i => i.id === item_id);
      matches = item !== undefined;
      
      if (matches && min_quantity && item) {
        matches = item.quantity >= min_quantity;
      }
    } else if (item_category) {
      // Check category
      const categoryItems = cart.items.filter(i => i.category === item_category);
      matches = categoryItems.length > 0;
      
      if (matches && min_quantity) {
        const totalQty = categoryItems.reduce((sum, i) => sum + i.quantity, 0);
        matches = totalQty >= min_quantity;
      }
    }
    
    if (!matches) return false;
  }
  
  // AND cart missing
  if (conditions.and_cart_missing) {
    const { item_id, item_category } = conditions.and_cart_missing;
    
    if (item_id) {
      const hasItem = cart.items.some(i => i.id === item_id);
      if (hasItem) return false; // Should NOT have this item
    } else if (item_category) {
      const hasCategory = cart.items.some(i => i.category === item_category);
      if (hasCategory) return false; // Should NOT have this category
    }
  }
  
  // IF cart total
  if (conditions.if_cart_total) {
    const { min, max } = conditions.if_cart_total;
    
    if (min !== undefined && cart.total < min) return false;
    if (max !== undefined && cart.total > max) return false;
  }
  
  return true;
}

/**
 * Check rule constraints (time, day, cart value)
 */
function meetsConstraints(rule: any, cart: Cart): boolean {
  if (!rule.constraints) return true;
  
  const { min_cart_value, max_cart_value, time_of_day, days_of_week } = rule.constraints;
  
  // Cart value constraints
  if (min_cart_value && cart.total < min_cart_value) return false;
  if (max_cart_value && cart.total > max_cart_value) return false;
  
  // Time of day
  if (time_of_day && time_of_day.length > 0) {
    const hour = new Date().getHours();
    const period = 
      hour < 11 ? 'breakfast' :
      hour < 16 ? 'lunch' :
      'dinner';
    
    if (!time_of_day.includes(period)) return false;
  }
  
  // Days of week
  if (days_of_week && days_of_week.length > 0) {
    const day = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    if (!days_of_week.includes(day)) return false;
  }
  
  return true;
}

/**
 * Track impression in overlay DB
 */
async function trackImpression(data: {
  ruleId: string;
  sessionId: string;
  customerId?: string;
  cartItems: any[];
  cartTotal: number;
  suggestedItemId: string;
  suggestedItemName: string;
  suggestedItemPrice: number;
  discountApplied: number;
}): Promise<void> {
  await overlayDb.query(`
    INSERT INTO upsell_impressions (
      rule_id, session_id, customer_id,
      cart_items, cart_total,
      suggested_item_id, suggested_item_name, suggested_item_price,
      discount_applied
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    data.ruleId,
    data.sessionId,
    data.customerId,
    JSON.stringify(data.cartItems),
    data.cartTotal,
    data.suggestedItemId,
    data.suggestedItemName,
    data.suggestedItemPrice,
    data.discountApplied
  ]);
}

/**
 * Track upsell result (accept/decline)
 */
export async function trackUpsellResult(
  ruleId: string,
  sessionId: string,
  customerId: string | undefined,
  suggestedItemId: string,
  result: 'accepted' | 'declined',
  revenue: number
): Promise<void> {
  // Update the most recent impression for this session/rule/item with result
  await overlayDb.query(`
    UPDATE upsell_impressions
    SET 
      result = $1,
      result_timestamp = GETDATE(),
      revenue_attributed = $2
    WHERE rule_id = $3 
      AND session_id = $4
      AND suggested_item_id = $5
      AND result IS NULL
    ORDER BY shown_at DESC
    LIMIT 1
  `, [result, revenue || 0, ruleId, sessionId, suggestedItemId]);
}
