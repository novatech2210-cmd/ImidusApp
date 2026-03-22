import { z } from 'zod';

// Condition schema
const conditionSchema = z.object({
  if_cart_contains: z.object({
    item_id: z.string().uuid().optional(),
    item_category: z.string().optional(),
    min_quantity: z.number().int().min(1).optional(),
    max_quantity: z.number().int().min(1).optional()
  }).optional(),
  and_cart_missing: z.object({
    item_id: z.string().uuid().optional(),
    item_category: z.string().optional()
  }).optional(),
  if_cart_total: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional()
  }).optional()
});

// Suggestion schema
const suggestionSchema = z.object({
  pos_item_id: z.string().uuid(),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  message: z.string().max(255).optional()
});

// Constraint schema
const constraintSchema = z.object({
  min_cart_value: z.number().min(0).optional(),
  max_cart_value: z.number().min(0).optional(),
  time_of_day: z.array(z.enum(['breakfast', 'lunch', 'dinner'])).optional(),
  days_of_week: z.array(z.enum([
    'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday'
  ])).optional()
});

// Full rule schema
export const ruleSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  priority: z.number().int().min(0).max(100),
  active: z.boolean(),
  conditions: conditionSchema,
  suggestions: z.array(suggestionSchema).min(1),
  constraints: constraintSchema.optional()
});

/**
 * Validate rule and check POS items
 */
export async function validateRule(
  rule: any
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  // Schema validation
  const parsed = ruleSchema.safeParse(rule);
  if (!parsed.success) {
    errors.push(...parsed.error.issues.map((e) => e.message));
    return { valid: false, errors };
  }
  
  // Validate suggested items exist in POS through backend API
  const itemIds = rule.suggestions.map((s: any) => s.pos_item_id);
  const multiResponse = await fetch('/api/pos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'validateMultiple', itemIds }),
    cache: 'no-store'
  });

  if (!multiResponse.ok) {
    errors.push('Unable to validate suggested POS items');
    return { valid: false, errors };
  }

  const validationMap: Record<string, boolean> = await multiResponse.json();

  itemIds.forEach((id: string) => {
    if (!validationMap[id]) {
      errors.push(`Item ${id} not found in POS menu`);
    }
  });

  // Validate condition items (if specific item_id) through backend API
  if (rule.conditions?.if_cart_contains?.item_id) {
    const conditionItemId = rule.conditions.if_cart_contains.item_id;
    const singleResponse = await fetch(
      `/api/pos?action=validate&itemId=${encodeURIComponent(conditionItemId)}`,
      { method: 'GET', cache: 'no-store' }
    );

    if (!singleResponse.ok) {
      errors.push(`Unable to validate condition item ${conditionItemId}`);
      return { valid: false, errors };
    }

    const valid = await singleResponse.json();
    if (!valid.valid) {
      errors.push(`Condition item ${conditionItemId} not found in POS`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
