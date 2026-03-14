/**
 * Upsell Rules API - Overlay Database Operations
 *
 * SSOT Compliance - CRITICAL:
 * - This module ONLY READS and WRITES to IntegrationService overlay database
 * - NO operations on INI_Restaurant (POS) database
 * - Rules are stored separately from POS data
 */

import { getOverlayConnection } from '@/lib/db';

export interface UpsellRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  active: boolean;
  conditions: any;
  suggestions: any[];
  constraints?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRuleRequest {
  name: string;
  description?: string;
  priority?: number;
  active?: boolean;
  conditions: any;
  suggestions: any[];
  constraints?: any;
  createdBy?: string;
}

export interface UpdateRuleRequest {
  name?: string;
  description?: string;
  priority?: number;
  active?: boolean;
  conditions?: any;
  suggestions?: any[];
  constraints?: any;
}

/**
 * Fetch all active upsell rules from overlay database
 * Ordered by priority (highest first)
 */
export async function getActiveRules(): Promise<UpsellRule[]> {
  try {
    const conn = await getOverlayConnection();
    
    const result = await conn.query(`
      SELECT 
        id,
        name,
        description,
        priority,
        active,
        conditions,
        suggestions,
        constraints,
        created_by,
        created_at,
        updated_at
      FROM upselling_rules
      WHERE active = 1
      ORDER BY priority DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching active rules:', error);
    throw new Error('Failed to fetch active rules');
  }
}

/**
 * Fetch a single rule by ID
 */
export async function getRuleById(ruleId: string): Promise<UpsellRule | null> {
  try {
    const conn = await getOverlayConnection();
    
    const result = await conn.query(`
      SELECT 
        id,
        name,
        description,
        priority,
        active,
        conditions,
        suggestions,
        constraints,
        created_by,
        created_at,
        updated_at
      FROM upselling_rules
      WHERE id = $1
    `, [ruleId]);
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching rule:', error);
    throw new Error('Failed to fetch rule');
  }
}

/**
 * Create a new upsell rule
 */
export async function createRule(request: CreateRuleRequest): Promise<UpsellRule> {
  try {
    const conn = await getOverlayConnection();
    
    const result = await conn.query(`
      INSERT INTO upselling_rules 
      (name, description, priority, active, conditions, suggestions, constraints, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, name, description, priority, active, 
        conditions, suggestions, constraints, created_by, created_at, updated_at
    `, [
      request.name,
      request.description,
      request.priority ?? 0,
      request.active ?? true,
      JSON.stringify(request.conditions),
      JSON.stringify(request.suggestions),
      JSON.stringify(request.constraints ?? {}),
      request.createdBy ?? 'system'
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating rule:', error);
    throw new Error('Failed to create rule');
  }
}

/**
 * Update an existing upsell rule
 */
export async function updateRule(ruleId: string, request: UpdateRuleRequest): Promise<UpsellRule> {
  try {
    const conn = await getOverlayConnection();
    
    const result = await conn.query(`
      UPDATE upselling_rules
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        active = COALESCE($4, active),
        conditions = COALESCE($5, conditions),
        suggestions = COALESCE($6, suggestions),
        constraints = COALESCE($7, constraints),
        updated_at = NOW()
      WHERE id = $8
      RETURNING 
        id, name, description, priority, active, 
        conditions, suggestions, constraints, created_by, created_at, updated_at
    `, [
      request.name,
      request.description,
      request.priority,
      request.active,
      request.conditions ? JSON.stringify(request.conditions) : null,
      request.suggestions ? JSON.stringify(request.suggestions) : null,
      request.constraints ? JSON.stringify(request.constraints) : null,
      ruleId
    ]);
    
    if (result.rows.length === 0) {
      throw new Error('Rule not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating rule:', error);
    throw new Error('Failed to update rule');
  }
}

/**
 * Soft delete a rule (set active to false)
 */
export async function deleteRule(ruleId: string): Promise<void> {
  try {
    const conn = await getOverlayConnection();
    
    const result = await conn.query(`
      UPDATE upselling_rules
      SET active = 0, updated_at = NOW()
      WHERE id = $1
    `, [ruleId]);
    
    if (result.rowCount === 0) {
      throw new Error('Rule not found');
    }
  } catch (error) {
    console.error('Error deleting rule:', error);
    throw new Error('Failed to delete rule');
  }
}

/**
 * Get rule templates from overlay database
 */
export async function getRuleTemplates(): Promise<any[]> {
  try {
    const conn = await getOverlayConnection();
    
    const result = await conn.query(`
      SELECT id, name, description, template_json, category, created_at
      FROM upselling_rule_templates
      ORDER BY category, name
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching rule templates:', error);
    throw new Error('Failed to fetch rule templates');
  }
}
