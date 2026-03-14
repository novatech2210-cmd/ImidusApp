-- Banner Management Schema for Overlay Database
-- IMPORTANT: This is stored in the OVERLAY database, NOT INI_Restaurant (POS)
-- Banners are marketing content managed separately from POS data

-- Drop existing table if exists (for development)
-- DROP TABLE IF EXISTS banners;

-- Main banners table
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    image_url TEXT NOT NULL,
    bg_gradient VARCHAR(500),
    cta_text VARCHAR(100),
    cta_link VARCHAR(500),
    targeting_rules JSONB DEFAULT '{}',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    priority INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comment on table and columns
COMMENT ON TABLE banners IS 'Marketing banners for homepage carousel - stored in overlay DB only';
COMMENT ON COLUMN banners.targeting_rules IS 'JSON targeting rules: segments, conditions for customer filtering';
COMMENT ON COLUMN banners.priority IS 'Display order priority (higher = shown first, 0-100 range)';
COMMENT ON COLUMN banners.active IS 'Soft delete flag - false means banner is disabled';

-- Indexes for performance
CREATE INDEX idx_banners_active ON banners(active, start_date, end_date);
CREATE INDEX idx_banners_priority ON banners(priority DESC);
CREATE INDEX idx_banners_dates ON banners(start_date, end_date) WHERE active = true;

-- Targeting Rules JSON Format Documentation:
-- {
--   "segments": ["high-spend", "frequent", "recent", "birthday", "new", "all"],
--   "conditions": {
--     "high-spend": { "lifetime_value": { "gt": 500 } },
--     "frequent": { "visit_count": { "gt": 10 } },
--     "recent": { "last_order_days": { "lt": 14 } },
--     "birthday": { "days_range": 7 }
--   }
-- }
--
-- Segment Definitions:
-- - "all": Show to all customers (default)
-- - "new": First-time visitors (no account or no orders)
-- - "high-spend": Customers with lifetime_value > threshold (default $500)
-- - "frequent": Customers with visit_count > threshold (default 10)
-- - "recent": Customers with last order within N days (default 14)
-- - "birthday": Customers with birthday within N days (default 7)
-- - Loyalty tiers: "bronze", "silver", "gold", "vip"

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_banner_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
CREATE TRIGGER banner_updated_at
    BEFORE UPDATE ON banners
    FOR EACH ROW
    EXECUTE FUNCTION update_banner_timestamp();

-- Seed data for initial banners
INSERT INTO banners (id, title, subtitle, description, image_url, bg_gradient, cta_text, cta_link, targeting_rules, priority, active)
VALUES
    (
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'Welcome to IMIDUSAPP',
        'Your First Order Awaits',
        'Experience seamless ordering with real-time POS integration. Join thousands of satisfied customers.',
        '/images/banners/welcome.jpg',
        'linear-gradient(135deg, #1E5AA8 0%, #174785 100%)',
        'Start Ordering',
        '/menu',
        '{"segments": ["all", "new"]}',
        100,
        true
    ),
    (
        'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        'Gold Member Exclusive',
        'Premium Experience',
        'Enjoy 10% bonus points on every order and exclusive access to new menu items before anyone else!',
        '/images/banners/gold.jpg',
        'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
        'Explore Menu',
        '/menu',
        '{"segments": ["gold"]}',
        95,
        true
    ),
    (
        'c3d4e5f6-a7b8-9012-cdef-123456789012',
        'Weekend Special',
        '20% Off Family Meals',
        'This weekend only! Order any family combo and save 20%. Perfect for sharing with loved ones.',
        '/images/banners/weekend.jpg',
        'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
        'View Family Meals',
        '/menu',
        '{"segments": ["all"]}',
        80,
        true
    ),
    (
        'd4e5f6a7-b8c9-0123-defa-234567890123',
        'VIP Status Unlocked',
        'Elite Member Benefits',
        'Welcome to the inner circle. Enjoy complimentary upgrades, birthday rewards, and dedicated support.',
        '/images/banners/vip.jpg',
        'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)',
        'VIP Ordering',
        '/menu',
        '{"segments": ["vip"]}',
        100,
        true
    ),
    (
        'e5f6a7b8-c9d0-1234-efab-345678901234',
        'Birthday Celebration',
        'Your Special Day Reward',
        'Happy Birthday! Enjoy a complimentary dessert with any order this week.',
        '/images/banners/birthday.jpg',
        'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
        'Claim Reward',
        '/menu',
        '{"segments": ["birthday"], "conditions": {"birthday": {"days_range": 7}}}',
        99,
        true
    );

-- View for active banners (convenience view)
CREATE OR REPLACE VIEW active_banners AS
SELECT
    id,
    title,
    subtitle,
    description,
    image_url,
    bg_gradient,
    cta_text,
    cta_link,
    targeting_rules,
    priority,
    start_date,
    end_date
FROM banners
WHERE active = true
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW())
ORDER BY priority DESC;
