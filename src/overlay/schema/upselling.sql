-- Upselling Rules Schema for IntegrationService (Overlay Database)
-- SSOT: Rules stored in overlay database, NOT in POS database

-- Drop existing tables if they exist (for clean setup)
IF OBJECT_ID('upselling_rule_templates', 'U') IS NOT NULL
    DROP TABLE upselling_rule_templates;

IF OBJECT_ID('upselling_rules', 'U') IS NOT NULL
    DROP TABLE upselling_rules;

-- Upselling Rules Table
CREATE TABLE upselling_rules (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    priority INT DEFAULT 0,
    active BIT DEFAULT 1,
    
    -- Conditions (JSON for flexibility)
    conditions NVARCHAR(MAX) NOT NULL DEFAULT '{}',
    
    -- Suggestions (array of POS item IDs)
    suggestions NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    
    -- Constraints
    constraints NVARCHAR(MAX) DEFAULT '{}',
    
    -- Metadata
    created_by NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT valid_priority CHECK (priority >= 0 AND priority <= 100)
);

-- Indexes for performance
CREATE INDEX idx_upsell_rules_active_priority 
    ON upselling_rules(active, priority DESC) 
    WHERE active = 1;

-- JSON indexes for SQL Server 2005 compatibility
-- Note: SQL Server 2005 doesn't support GIN indexes, using computed columns instead
-- We'll create computed columns for common query patterns
ALTER TABLE upselling_rules 
ADD conditions_json AS CAST(conditions AS NVARCHAR(MAX));

ALTER TABLE upselling_rules 
ADD suggestions_json AS CAST(suggestions AS NVARCHAR(MAX));

-- Rule templates for quick creation
CREATE TABLE upselling_rule_templates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    template_json NVARCHAR(MAX) NOT NULL,
    category NVARCHAR(100),
    created_at DATETIME DEFAULT GETDATE()
);

-- Insert default templates
INSERT INTO upselling_rule_templates (name, description, template_json, category)
VALUES 
(
    'Item to Item Upsell',
    'Suggest specific item when another is in cart',
    '{"conditions":{"if_cart_contains":{"item_id":null}},"suggestions":[{"pos_item_id":null,"discount_percent":0}]}',
    'basic'
),
(
    'Category to Item Upsell',
    'Suggest item when category is in cart',
    '{"conditions":{"if_cart_contains":{"item_category":null}},"suggestions":[{"pos_item_id":null,"discount_percent":10}]}',
    'basic'
),
(
    'Value-Based Upsell',
    'Suggest item when cart exceeds value',
    '{"conditions":{"if_cart_total":{"min":20.00}},"suggestions":[{"pos_item_id":null,"message":"You deserve a treat!"}]}',
    'value'
);

-- Example conditions format:
-- {
--   "if_cart_contains": {
--     "item_id": "pos-item-123",
--     "item_category": "burgers",
--     "min_quantity": 1
--   },
--   "and_cart_missing": {
--     "item_category": "sides"
--   }
-- }

-- Example suggestions format:
-- [
--   {
--     "pos_item_id": "pos-item-456",
--     "discount_percent": 10,
--     "message": "Add fries for only $2.70!"
--   }
-- ]

-- Example constraints format:
-- {
--   "min_cart_value": 5.00,
--   "max_cart_value": 50.00,
--   "time_of_day": ["lunch", "dinner"],
--   "days_of_week": ["monday", "tuesday", "wednesday", "thursday", "friday"]
-- }
