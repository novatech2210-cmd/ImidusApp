-- Upsell Tracking Schema for IntegrationService (Overlay Database)
-- SSOT: Tracking data stored in overlay database, NOT in POS database

-- Drop existing tables if they exist (for clean setup)
IF OBJECT_ID('upsell_impressions', 'U') IS NOT NULL
    DROP TABLE upsell_impressions;

IF OBJECT_ID('upsell_analytics_daily', 'U') IS NOT NULL
    DROP TABLE upsell_analytics_daily;

-- Upsell Impressions (when suggestion is shown)
CREATE TABLE upsell_impressions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    rule_id UNIQUEIDENTIFIER NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255), -- POS customer ID (if logged in)
    
    -- Cart snapshot
    cart_items NVARCHAR(MAX) NOT NULL, -- JSON
    cart_total DECIMAL(10,2) NOT NULL,
    
    -- Suggested item (from POS)
    suggested_item_id VARCHAR(255) NOT NULL,
    suggested_item_name VARCHAR(255),
    suggested_item_price DECIMAL(10,2),
    discount_applied DECIMAL(10,2) DEFAULT 0,
    
    -- Result tracking
    result VARCHAR(20), -- 'accepted', 'declined', 'ignored'
    result_timestamp DATETIME,
    
    -- Attribution
    revenue_attributed DECIMAL(10,2),
    
    -- Metadata
    shown_at DATETIME DEFAULT GETDATE(),
    device_type VARCHAR(50),
    
    CONSTRAINT valid_result CHECK (result IN ('accepted', 'declined', 'ignored', NULL))
);

-- Indexes for performance
CREATE INDEX idx_upsell_impressions_rule ON upsell_impressions(rule_id);
CREATE INDEX idx_upsell_impressions_session ON upsell_impressions(session_id);
CREATE INDEX idx_upsell_impressions_result ON upsell_impressions(result);
CREATE INDEX idx_upsell_impressions_shown_at ON upsell_impressions(shown_at);
CREATE INDEX idx_upsell_impressions_customer ON upsell_impressions(customer_id);

-- Analytics aggregation table (updated daily)
CREATE TABLE upsell_analytics_daily (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    rule_id UNIQUEIDENTIFIER NOT NULL,
    date DATE NOT NULL,
    
    -- Metrics
    total_impressions INTEGER DEFAULT 0,
    total_accepts INTEGER DEFAULT 0,
    total_declines INTEGER DEFAULT 0,
    total_ignored INTEGER DEFAULT 0,
    
    -- Calculated rates
    acceptance_rate DECIMAL(5,2),
    decline_rate DECIMAL(5,2),
    
    -- Revenue
    total_revenue DECIMAL(10,2) DEFAULT 0,
    avg_upsell_value DECIMAL(10,2),
    
    -- Updated
    updated_at DATETIME DEFAULT GETDATE(),
    
    UNIQUE(rule_id, date)
);

-- Indexes for analytics
CREATE INDEX idx_analytics_rule_date ON upsell_analytics_daily(rule_id, date);

-- Function to aggregate daily analytics
-- Note: SQL Server 2005 doesn't support CREATE OR REPLACE FUNCTION
-- We need to drop and recreate
IF OBJECT_ID('aggregate_upsell_analytics', 'P') IS NOT NULL
    DROP PROCEDURE aggregate_upsell_analytics;

GO

CREATE PROCEDURE aggregate_upsell_analytics
    @target_date DATE
AS
BEGIN
    -- Insert or update daily analytics
    MERGE upsell_analytics_daily AS target
    USING (
        SELECT 
            rule_id,
            COUNT(*) as total_impressions,
            COUNT(CASE WHEN result = 'accepted' THEN 1 END) as total_accepts,
            COUNT(CASE WHEN result = 'declined' THEN 1 END) as total_declines,
            COUNT(CASE WHEN result IS NULL OR result = 'ignored' THEN 1 END) as total_ignored,
            ROUND(
                CAST(COUNT(CASE WHEN result = 'accepted' THEN 1 END) AS NUMERIC) / 
                NULLIF(CAST(COUNT(*) AS NUMERIC), 0) * 100, 
                2
            ) as acceptance_rate,
            ROUND(
                CAST(COUNT(CASE WHEN result = 'declined' THEN 1 END) AS NUMERIC) / 
                NULLIF(CAST(COUNT(*) AS NUMERIC), 0) * 100, 
                2
            ) as decline_rate,
            COALESCE(SUM(revenue_attributed), 0) as total_revenue,
            ROUND(AVG(CASE WHEN result = 'accepted' THEN revenue_attributed END), 2) as avg_upsell_value
        FROM upsell_impressions
        WHERE CAST(shown_at AS DATE) = @target_date
        GROUP BY rule_id
    ) AS source
    ON target.rule_id = source.rule_id AND target.date = @target_date
    WHEN MATCHED THEN
        UPDATE SET 
            total_impressions = source.total_impressions,
            total_accepts = source.total_accepts,
            total_declines = source.total_declines,
            total_ignored = source.total_ignored,
            acceptance_rate = source.acceptance_rate,
            decline_rate = source.decline_rate,
            total_revenue = source.total_revenue,
            avg_upsell_value = source.avg_upsell_value,
            updated_at = GETDATE()
    WHEN NOT MATCHED THEN
        INSERT (rule_id, date, total_impressions, total_accepts, total_declines, total_ignored, acceptance_rate, decline_rate, total_revenue, avg_upsell_value)
        VALUES (source.rule_id, @target_date, source.total_impressions, source.total_accepts, source.total_declines, source.total_ignored, source.acceptance_rate, source.decline_rate, source.total_revenue, source.avg_upsell_value);
END;
