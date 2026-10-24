-- CAISHOP Migration 0005: Analytics, Product Views, Size Returns & Search Duration Tracking
-- Cloudflare D1 (SQLite)

-- 1. Product Views Tracking
CREATE TABLE IF NOT EXISTS product_views (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    session_id TEXT,
    viewed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Size Returns & Exchange Analysis (Chật / Rộng / Lý do)
CREATE TABLE IF NOT EXISTS size_returns (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    variant_sku TEXT,
    size TEXT NOT NULL,
    color TEXT,
    return_reason TEXT NOT NULL, -- 'TIGHT' (Chật), 'LOOSE' (Rộng), 'OTHER' (Khác)
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Search Session Logs & Duration Tracking
CREATE TABLE IF NOT EXISTS search_logs (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    duration_seconds REAL NOT NULL DEFAULT 0,
    results_count INTEGER NOT NULL DEFAULT 0,
    selected_product_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_views_pid ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_size_returns_size ON size_returns(size);
CREATE INDEX IF NOT EXISTS idx_size_returns_pid ON size_returns(product_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
